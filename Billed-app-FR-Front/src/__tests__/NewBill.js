/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then email icon in vertical layout should be highlighted and bill icon should not be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
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
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");
      const billIcon = screen.getByTestId("icon-window");
      expect(mailIcon.getAttribute("class")).toContain("active-icon");
      expect(billIcon.getAttribute("class")).toBeNull();
    });
  });
  describe("When I am on NewBill Page and I click to submit", () => {
    test("then it should call handleSubmit and render bill page", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const form = screen.getByTestId("form-new-bill");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBillsClass = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleSubmit1 = jest.fn(newBillsClass.handleSubmit);
      form.addEventListener("submit", handleSubmit1);
      fireEvent.submit(form);
      expect(handleSubmit1).toHaveBeenCalled();
      // expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    });
  });

  describe("When I am on NewBill Page and I select file with correct extension (jpeg, png or jpg)", () => {
    test("No message error should be shown and send btn should be enable", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBillsClass = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const handleChangeFile1 = jest.fn((e) =>
        newBillsClass.handleChangeFile(e)
      );
      const fileInput = screen.getByTestId("file");
      const file = new File(["hello"], "hello.png", { type: "image/png" });
      const errorMessage = screen.getByTestId("error-message");
      const btn = screen.getByTestId("btn-send-bill");
      fileInput.addEventListener("change", handleChangeFile1);
      userEvent.upload(fileInput, file);
      expect(btn.disabled).toEqual(false);
      expect(errorMessage.style.display).toEqual("none");
    });
  });

  describe("When I am on NewBill Page and I select file with not a correct extension (pdf for example)", () => {
    test("Message error should be shown and send btn should be disable", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBillsClass = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const handleChangeFile1 = jest.fn((e) =>
        newBillsClass.handleChangeFile(e)
      );
      const fileInput = screen.getByTestId("file");
      const file = new File(["hello"], "hello.pdf", {
        type: "application/pdf",
      });
      const errorMessage = screen.getByTestId("error-message");
      const btn = screen.getByTestId("btn-send-bill");
      fileInput.addEventListener("change", handleChangeFile1);
      userEvent.upload(fileInput, file);
      expect(btn.disabled).toEqual(true);
      expect(errorMessage.style.display).toEqual("flex");
    });
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I submit form with valid inputs", () => {
    test("Then fetches bill from mock API POST", async () => {
      const billUpdateMocked = mockStore.bills().update();
      const billPromiseSolved = await billUpdateMocked.then((data) => {
        return data;
      });

      expect(billPromiseSolved.id).toEqual("47qAXb6fIm2zOKkLzMro");
      expect(billPromiseSolved.vat).toEqual("80");
      expect(billPromiseSolved.amount).toEqual(400);
      expect(billPromiseSolved.fileUrl).toEqual(
        "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a"
      );
    });
  });
});

describe("Given I am connected as an employee", () => {
  describe("When an error occurs on API", () => {
    test("Then fetch console.log error 404 from API", async () => {
      jest.spyOn(mockStore, "bills");
      console.error = jest.fn();

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
      document.body.innerHTML = `<div id="root"></div>`;
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      const newBillsClass = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit1 = jest.fn(newBillsClass.handleSubmit);
      form.addEventListener("submit", handleSubmit1);
      fireEvent.submit(form);

      await new Promise(process.nextTick);
      expect(console.error).toBeCalled();
    });
  });
});
