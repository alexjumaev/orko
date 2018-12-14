context("Auth API", () => {
  beforeEach(function() {
    cy.logout()
  })

  it("Check whitelisting", () => {
    cy.clearWhitelist()

    cy.request("/api/auth")
      .its("body")
      .should("eq", "false")

    cy.requestNoFail("/api/exchanges")
      .its("status")
      .should("eq", 403)
    cy.requestNoFail("/api/exchanges/binance/orders")
      .its("status")
      .should("eq", 403)
    cy.requestNoFail("/admin")
      .its("status")
      .should("eq", 403)
    cy.requestNoFail("/api/db.zip")
      .its("status")
      .should("eq", 403)

    cy.whitelist({ valid: false })

    cy.requestNoFail("/api/exchanges")
      .its("status")
      .should("eq", 403)
    cy.requestNoFail("/api/exchanges/binance/orders")
      .its("status")
      .should("eq", 403)
    cy.requestNoFail("/admin")
      .its("status")
      .should("eq", 403)
    cy.requestNoFail("/api/db.zip")
      .its("status")
      .should("eq", 403)

    cy.whitelist()

    cy.request("/api/auth")
      .its("body")
      .should("eq", "true")

    cy.requestNoFail("/api/exchanges")
      .its("status")
      .should("eq", 401)
    cy.requestNoFail("/api/exchanges/binance/orders")
      .its("status")
      .should("eq", 401)
    cy.requestNoFail("/admin")
      .its("status")
      .should("eq", 401)
    cy.requestNoFail("/api/db.zip")
      .its("status")
      .should("eq", 401)

    cy.clearWhitelist({ failOnStatusCode: true })

    cy.requestNoFail("/api/exchanges")
      .its("status")
      .should("eq", 403)
  })

  it("Check failed logins", () => {
    cy.whitelist()
    cy.loginApi({ validUser: false })
    cy.loginApi({ validPassword: false })
    cy.loginApi({ validToken: false })
  })

  it("Check invalid XSRF", () => {
    cy.whitelist()
    cy.loginApi()
      .its("status")
      .should("eq", 200)
    cy.request({
      url: "/api/exchanges",
      failOnStatusCode: false,
      headers: {
        "x-xsrf-token": "WRONG"
      }
    })
      .its("status")
      .should("eq", 401)
    cy.getCookie("accessToken")
      .its("httpOnly")
      .should("eq", true)
  })

  it("Check success", () => {
    cy.whitelist()
    cy.loginApi()
      .its("body")
      .then(auth => {
        cy.request({
          url: "/api/exchanges",
          failOnStatusCode: false,
          headers: {
            "x-xsrf-token": auth.xsrf
          }
        })
          .its("status")
          .should("eq", 200)
        cy.request({
          url: "/admin",
          failOnStatusCode: false,
          headers: {
            "x-xsrf-token": auth.xsrf
          }
        })
          .its("status")
          .should("eq", 200)
        cy.request({
          url: "/api/db.zip",
          failOnStatusCode: false,
          headers: {
            "x-xsrf-token": auth.xsrf
          }
        })
          .its("status")
          .should("eq", 200)
      })
    cy.getCookie("accessToken")
      .its("httpOnly")
      .should("eq", true)
  })
})
