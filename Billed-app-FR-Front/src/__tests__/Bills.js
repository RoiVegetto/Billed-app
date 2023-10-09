/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from '@testing-library/dom';
import BillsUI from '../views/BillsUI.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import Bills from '../containers/Bills.js';
import { ROUTES } from '../constants/routes.js';
import mockedStore from '../__mocks__/store';

import router from '../app/Router.js';

jest.mock('../app/store', () => mockedStore);

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

    describe('When i am on the bills page and i click on the eye icon button', () => {
      test('then a modal should open', () => {
        const html = BillsUI({ data: bills });
        document.body.innerHTML = html;
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const bill = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });
        $.fn.modal = jest.fn();
        const button = screen.getAllByTestId('icon-eye')[0];
        const handleClickIconEye = jest.fn((e) => {
          e.preventDefault();
          bill.handleClickIconEye(button);
        });
        button.addEventListener('click', handleClickIconEye);
        fireEvent.click(button);

        expect(handleClickIconEye).toHaveBeenCalled();
      });
    });

    describe('When i am on the bills page and i click on the make new Bill Button', () => {
      test('a new bill modal should open', () => {
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
          })
        );

        const html = BillsUI({ data: [] });
        document.body.innerHTML = html;
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const bills = new Bills({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage,
        });
        const button = screen.getByTestId('btn-new-bill');
        const handleClickNewBill = jest.fn((e) => bills.handleClickNewBill(e));
        button.click('click', handleClickNewBill);
        fireEvent.click(button);
        expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();
      });
    });
    describe('When an error occurs on API', () => {
      beforeEach(() => {
        jest.spyOn(mockedStore, 'bills');
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
            email: 'a@a',
          })
        );
        const root = document.createElement('div');
        root.setAttribute('id', 'root');
        document.body.appendChild(root);
        router();
      });
    });
  });
});

/*describe('Given I am a user connected as Admin', () => {
  describe('When I navigate to Dashboard', () => {
    test('fetches bills from mock API GET', async () => {
      localStorage.setItem(
        'user',
        JSON.stringify({ type: 'Admin', email: 'a@a' })
      );
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Dashboard);
      await waitFor(() => screen.getByText('Validations'));
      const contentPending = await screen.getByText('En attente (1)');
      expect(contentPending).toBeTruthy();
      const contentRefused = await screen.getByText('Refusé (2)');
      expect(contentRefused).toBeTruthy();
      expect(screen.getByTestId('big-billed-icon')).toBeTruthy();
    });
    describe('When an error occurs on API', () => {
      beforeEach(() => {
        jest.spyOn(mockStore, 'bills');
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Admin',
            email: 'a@a',
          })
        );
        const root = document.createElement('div');
        root.setAttribute('id', 'root');
        document.body.appendChild(root);
        router();
      });
      test('fetches bills from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 404'));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Dashboard);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test('fetches messages from an API and fails with 500 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 500'));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Dashboard);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});*/
