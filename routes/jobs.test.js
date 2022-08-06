"use strict";
process.env.NODE_ENV = "test";
const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token, u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "test job",
    salary: 99999,
    equity: "0.05",
    companyHandle: "c1"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body.job.title).toEqual("test job");
    expect(resp.body.job.salary).toEqual(99999);
    expect(resp.body.job.equity).toEqual("0.05");
    expect(resp.body.job.companyHandle).toEqual("c1");
  });

  test("user is not authorized admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: {
        message: 'Unauthorized',
        status: 401
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new job"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: 5,
          salary: 99999,
          equity: "0.05",
          companyHandle: "c1"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
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
              salary: 1150000,
              equity: null,
              companyHandle: "c3"
            },
          ],
    });
  });
  
  //  Does route apply filterBy method when query params are included?
  test("works with query params as filters", async function () {
    const resp = await request(app).get("/jobs?title=j&minSalary=110000");
    expect(resp.body).toEqual({
      filteredJobs:
      [ {
        title: "j3",
        salary: 1150000,
        equity: null,
        companyHandle: "c3"
        }]
    });
    const res = await request(app).get("/jobs?hasEquity=true");
    expect(res.body).toEqual({
      filteredJobs:
      [ {
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
      }]
    });
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const testJob = {
      title: "test job",
      salary: 99999,
      equity: "0.05",
      companyHandle: "c1"
    }
    const jobRes = await request(app)
    .post("/jobs")
    .send(testJob)
    .set("authorization", `Bearer ${u1Token}`);
    expect(jobRes.statusCode).toEqual(201);

    const resp = await request(app).get(`/jobs/${jobRes.body.job.id}`);
    expect(resp.body.job.title).toEqual("test job");
    expect(resp.body.job.salary).toEqual(99999);
    });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/9999`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/id */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {

    const job = {
      title: "test job",
      salary: 100000,
      equity: "0.02",
      companyHandle: "c1"
    }
    const jobRes = await request(app)
      .post("/jobs/")
      .send(job)
      .set("authorization", `Bearer ${u1Token}`);
    expect(jobRes.statusCode).toEqual(201);

    const resp = await request(app)
        .patch(`/jobs/${jobRes.body.job.id}`)
        .send({
          title: "new test job"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body.job.title).toEqual("new test job");
    expect(resp.body.job.salary).toEqual(100000);
  });

  test("unauth for anon", async function () {
    
    const job = {
      title: "test job",
      salary: 100000,
      equity: "0.02",
      companyHandle: "c1"
    }
    const jobRes = await request(app)
    .post("/jobs/")
    .send(job)
    .set("authorization", `Bearer ${u1Token}`);
    expect(jobRes.statusCode).toEqual(201);
    
    const resp = await request(app)
        .patch(`/jobs/${jobRes.body.job.id}`)
        .send({
          title: "new test job"
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/9999`)
        .send({
          title: "new test job",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });


  test("bad request on company handle change attempt", async function () {    
    const job = {
      title: "test job",
      salary: 100000,
      equity: "0.02",
      companyHandle: "c1"
    }
    const jobRes = await request(app)
    .post("/jobs/")
    .send(job)
    .set("authorization", `Bearer ${u1Token}`);
    expect(jobRes.statusCode).toEqual(201);
    
    const resp = await request(app)
        .patch(`/jobs/${jobRes.body.job.id}`)
        .send({
          companyHandle: "c2",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });


  test("bad request on invalid data", async function () {
    const job = {
      title: "test job",
      salary: 100000,
      equity: "0.02",
      companyHandle: "c1"
    }
    const jobRes = await request(app)
    .post("/jobs/")
    .send(job)
    .set("authorization", `Bearer ${u1Token}`);
    expect(jobRes.statusCode).toEqual(201);
    
    const resp = await request(app)
        .patch(`/jobs/c1`)
        .send({
          title: 54,
          salary: "zero"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {  
  test("works for admin users", async function () {
    const job = {
      title: "test job",
      salary: 100000,
      equity: "0.02",
      companyHandle: "c1"
    }
    const jobRes = await request(app)
    .post("/jobs/")
    .send(job)
    .set("authorization", `Bearer ${u1Token}`);
    expect(jobRes.statusCode).toEqual(201);

    const resp = await request(app)
        .delete(`/jobs/${jobRes.body.job.id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${jobRes.body.job.id}` });
  });

  test("unauth for anon", async function () {
    const job = {
      title: "test job",
      salary: 100000,
      equity: "0.02",
      companyHandle: "c1"
    }
    const jobRes = await request(app)
    .post("/jobs/")
    .send(job)
    .set("authorization", `Bearer ${u1Token}`);
    expect(jobRes.statusCode).toEqual(201);

    const resp = await request(app)
        .delete(`/jobs/${jobRes.body.job.id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/9999`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});