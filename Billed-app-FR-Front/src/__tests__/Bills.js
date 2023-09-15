/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom';
import BillsUI from '../views/BillsUI.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import Bills from '../containers/Bills.js';

import router from '../app/Router.js';

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('Then bill icon in vertical layout should be highlighted', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      const activateIcon = windowIcon.classList.contains('active-icon');
      expect(activateIcon).toBeTruthy();
    });
    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe('When i create a bills object', () => {
      test('Then i can click on the new bills', () => {
        document.body.innerHTML = `<button type="button" data-testid='btn-new-bill' class="btn btn-primary">
      Nouvelle note de frais</button>`;
        let testBills = new Bills({
          document: document,
          onNavigate: null,
          firestore: null,
          localStorage: null,
        });
        testBills.onNavigate = jest.fn();
        const buttonNewBill = document.querySelector(
          `button[data-testid="btn-new-bill"]`
        );
        buttonNewBill.click();
        expect(testBills.onNavigate).toHaveBeenCalled();
      });
    });
  });
});
