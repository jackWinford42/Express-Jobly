"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds,
  u1Token,
  u4Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: 'President',
    salary: 123000,
    equity: 0.5,
    company_handle: 'c1',
  };

  test("ok for admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body.job).toEqual({
      id: expect.any(Number),
      title: 'President',
      salary: 123000,
      equity: '0.5',
      company_handle: 'c1',
    })
  });

  test("not ok for non-admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          id: 3463246,
          salary: -999,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get(`/jobs`);
    expect(resp.body).toEqual({
          jobs: [{
            id: jobIds[0],
            title: "Doctor",
            salary: 123000,
            equity: "0.1",
            company_handle: "c1",
          },
          {
            id: jobIds[2],
            title: "Sanitation Worker",
            salary: 234000,
            equity: null,
            company_handle: "c2",
          },
          {
            id: jobIds[1],
            title: "Secretary",
            salary: 7777777,
            equity: "0.555",
            company_handle: "c1",
          },]
          });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobIds[0]}`);
    expect(resp.body).toEqual({
      "job": {
        id: jobIds[0],
        title: "Doctor",
        salary: 123000,
        equity: "0.1",
        company_handle: "c1",
      },});
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/${846301}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[1]}`)
        .send({
          title: "CEO Entrepreneur",
          salary: 55555,
          equity: 0.333,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({
      job: {
        id: jobIds[1],
        title: "CEO Entrepreneur",
        salary: 55555,
        equity: "0.333",
        company_handle: "c1",
      },
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[2]}`)
        .send({
          title: "Secret Agent",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[2]}`)
        .send({
          title: "Lunar Landlord",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found and no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/${4399543}`)
        .send({
          title: "Private Eye",
          salary: 55555,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("error on company_handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          company_handle: "iansd135",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobIds[0]}`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({ deleted: `${(jobIds[0])}` });
  });

  test("unauth for non-admin user", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobIds[1]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobIds[1]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/companies/342436`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});