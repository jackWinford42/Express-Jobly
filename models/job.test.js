"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 123000,
    equity: 0.5,
    company_handle: 'c1',
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: job.id,
      title: "new",
      salary: 123000,
      equity: "0.5",
      company_handle: 'c1',
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
          FROM jobs
          WHERE id = ${job.id}`);
    expect(result.rows).toEqual([
      {
        "id": job.id,
        "title": "new",
        "salary": 123000,
        "equity": "0.5",
        "company_handle": "c1",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Podiatrist",
        salary: 68000,
        equity: null,
        company_handle: "c2",
      },
      {
        id: expect.any(Number),
        title: "Psychologist",
        salary: 172000,
        equity: "0",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Transporter",
        salary: 123000,
        equity: "0.091",
        company_handle: "c3",
      },
    ]);
  });
  test("works: name filter", async function() {
    let jobPsy = await Job.findAll({title:'Psychologist'});
    expect(jobPsy).toEqual([
      {
        id: expect.any(Number),
        title: "Psychologist",
        salary: 172000,
        equity: "0",
        company_handle: "c1",
      }
    ])
  });
  test("works: with minimum salary filter", async function() {
    let jobs = await Job.findAll({minSalary:68001});
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Psychologist",
        salary: 172000,
        equity: "0",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Transporter",
        salary: 123000,
        equity: "0.091",
        company_handle: "c3",
      },
    ])
  });
  test("works: with equity filter", async function() {
    let jobTran = await Job.findAll({hasEquity:true});
    expect(jobTran).toEqual([
      {
        id: expect.any(Number),
        title: "Transporter",
        salary: 123000,
        equity: "0.091",
        company_handle: "c3",
      },
    ])
  });
  test("works: with all filters", async function() {
    let jobTran = await Job.findAll({title:'Transporter',minSalary:122999,equity:true});
    expect(jobTran).toEqual([
      {
        id: expect.any(Number),
        title: "Transporter",
        salary: 123000,
        equity: "0.091",
        company_handle: "c3",
      },
    ])
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const newJob = {
      title: "new",
      salary: 123000,
      equity: 0.5,
      company_handle: 'c1',
    };
    let newJobInstance = await Job.create(newJob);
    let job = await Job.get(newJobInstance.id);
    expect(job).toEqual({
      id: newJobInstance.id,
      title: "new",
      salary: 123000,
      equity: "0.5",
      company_handle: 'c1',
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(8793548);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "new",
    salary: 123000,
    equity: 0.5,
  };
  test("works", async function () {
    const newJob = {
      title: "Front Desk Clerk",
      salary: 34000,
      equity: 0,
      company_handle: 'c1',
    };
    let newJobInstance = await Job.create(newJob);
    let job = await Job.update(newJobInstance.id, updateData);
    expect(job).toEqual({
      id: newJobInstance.id,
      title: "new",
      salary: 123000,
      equity: "0.5",
      "company_handle": "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
      FROM jobs
      WHERE id = ${job.id}`);
    expect(result.rows).toEqual([{
      id: newJobInstance.id,
      title: "new",
      salary: 123000,
      equity: "0.5",
      company_handle: "c1",
    }]);
  });

  test("works: null fields", async function () {
    const newJob = {
      title: "Front Desk Clerk",
      salary: 34000,
      equity: 0,
      company_handle: 'c1',
    };
    let newJobInstance = await Job.create(newJob);
    const updateDataSetNulls = {
      title: "new",
      salary: null,
      equity: null,
    };

    let job = await Job.update(newJobInstance.id, updateDataSetNulls);
    expect(job).toEqual({
      id: newJobInstance.id,
      title: "new",
      salary: null,
      equity: null,
      "company_handle": "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
      FROM jobs
      WHERE id = ${job.id}`);
    expect(result.rows).toEqual([{
      id: newJobInstance.id,
      title: "new",
      salary: null,
      equity: null,
      company_handle: "c1",
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update(78945987, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    const newJob = {
      title: "Front Desk Clerk",
      salary: 34000,
      equity: 0,
      company_handle: 'c1',
    };
    let newJobInstance = await Job.create(newJob);
    try {
      await Job.update(newJobInstance.id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const newJob = {
      title: "Front Desk Clerk",
      salary: 34000,
      equity: 0,
      company_handle: 'c1',
    };
    let newJobInstance = await Job.create(newJob);
    await Job.remove(newJobInstance.id);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${newJobInstance.id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(8943987);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});