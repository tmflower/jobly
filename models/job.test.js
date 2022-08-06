"use strict";
process.env.NODE_ENV = "test";

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
    title: "test job",
    salary: 99999,
    equity: "0.04",
    companyHandle: "c1"
  };

  test("works", async function () {
    let result = await Job.create(newJob);
    expect(result.title).toEqual("test job");
    expect(result.salary).toEqual(99999);
    expect(result.equity).toEqual("0.04");
    expect(result.companyHandle).toEqual("c1");
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        title: "j1",
        salary: 100000,
        equity: "0.02",
        companyHandle: "c1"
      },
      {
        title: "j2",
        salary: 85000,
        equity: "0.04",
        companyHandle: "c2"
      },
      {
        title: "j3",
        salary: 115000,
        equity: "0.01",
        companyHandle: "c3"
      },
    ]);
  });
});

/****************************************** filterBy */

describe("filterBy", function () {
  test("works: filter by title", async function () {
    let filters =  [['title', 'j3']];
    let jobs = await Job.filterBy(filters);
    expect(jobs).toEqual([{        
      title: "j3",
      salary: 115000,
      equity: "0.01",
      companyHandle: "c3" }]);
  });

  test("works: filter by minEmployees", async function () {
    let filters =  [['minSalary', 100000]];
    let jobs = await Job.filterBy(filters);
    expect(jobs).toEqual(    [
      { title: 'j3', salary: 115000, equity: '0.01', companyHandle: 'c3' },
      { title: 'j1', salary: 100000, equity: '0.02', companyHandle: 'c1' }
    ]);
  });

  test("works: filter by hasEquity", async function () {
    let filters =  [['hasEquity', true]];
    let jobs = await Job.filterBy(filters);

    expect(jobs).toEqual(        [
      { title: 'j3', salary: 115000, equity: '0.01', companyHandle: 'c3' },
      { title: 'j1', salary: 100000, equity: '0.02', companyHandle: 'c1' },
      { title: 'j2', salary: 85000, equity: '0.04', companyHandle: 'c2' }
    ]);
  });


// /************************************** get */

describe("get", function () {
  test("works", async function () {
    const job = await Job.get(2);
    expect(job).toEqual({
        id: 2,
        title: "j2",
        salary: 85000,
        equity: "0.04",
        companyHandle: "c2"
      });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(9999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "New Job",
    salary: 234567,
    equity: "0.01"
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
        id: 1,
        companyHandle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 1`);
   
    expect(result.rows).toEqual([{
        id: 1,
        title: "New Job",
        salary: 234567,
        equity: "0.01",
        company_handle: "c1",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "Another New Job",
      salary: null,
      equity: null,
    };

    let job = await Job.update(3, updateDataSetNulls);
    expect(job).toEqual({
      id: 3,
      companyHandle: "c3",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = 3`);
    expect(result.rows).toEqual([{
        id: 3,
        title: "Another New Job",
        salary: null,
        equity: null,
        company_handle: "c3"
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update(9999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(2);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=2");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(9999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
});