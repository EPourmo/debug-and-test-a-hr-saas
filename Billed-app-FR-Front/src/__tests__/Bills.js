/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import Bills from "../containers/Bills";
import router from "../app/Router.js";

// un constructeur simulé
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // on "simule" le local storage mocké
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      // on met la valeur du local storage
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      // on se situe sur la page Bills
      window.onNavigate(ROUTES_PATH.Bills);
      // on attend l'icône
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon).toBeTruthy();
      expect(windowIcon.getAttribute("class")).toContain("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      // on affiche des données à tester
      document.body.innerHTML = BillsUI({ data: bills });
      // on les recherche sur l'interface UX et on récupère leur valeur
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
  // ----------------unit tests added here ----------------
  describe("When I click to new Bill button", () => {
    test("Then, it should render new Bill page", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const billsClass = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      document.body.innerHTML = BillsUI({ data: bills });
      // on simule la fonction handleClickNewBill()
      const handleClickNewBill1 = jest.fn((e) =>
        billsClass.handleClickNewBill()
      );
      const newBillBtn = screen.getByTestId("btn-new-bill");
      newBillBtn.addEventListener("click", handleClickNewBill1);
      userEvent.click(newBillBtn);
      expect(handleClickNewBill1).toHaveBeenCalled();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
  });

  describe("When I click on the icon eye", () => {
    test("A modal should be opened", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = BillsUI({ data: bills });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const billsClass = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const eyes = screen.getAllByTestId("icon-eye");
      const eye = eyes[0];
      // avoiding to include Bootstrap for test suite
      $.fn.modal = jest.fn();
      const handleClickIconEye1 = jest.fn((e) =>
        billsClass.handleClickIconEye(eye)
      );
      eye.addEventListener("click", handleClickIconEye1);

      userEvent.click(eye);
      expect(handleClickIconEye1).toHaveBeenCalled();

      const modale = screen.getByTestId("modaleFileEmployee");
      expect(modale).toBeTruthy();
    });
  });

  // ----------------integration tests added here ----------------
  describe("When I navigate to bills list", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "e@e" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      // name of the first returned billed
      await waitFor(() => screen.getByText("encore"));
      expect(screen.getAllByText("encore")).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        // jest.spyOn(object, methodName);
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "e@e",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        // simulation pour l'appel de l'API avec rejet de promesse
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
