"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns { id, title, salary, equity, company_handle }
     *
     * Throws BadRequestError if job already in database.
     * */
  
    static async create({ title, salary, equity, companyHandle }) {
      const duplicateCheck = await db.query(
            `SELECT title, company_handle
             FROM jobs
             WHERE title = $1 AND company_handle = $2`,
             [title, companyHandle]);
      if (duplicateCheck.rows[0])
        throw new BadRequestError(`Duplicate job: ${title} at ${companyHandle}`);
  
      const result = await db.query(
            `INSERT INTO jobs
             (title, salary, equity, company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING title, salary, equity, company_handle AS "companyHandle"`,
          [
            title, salary, equity, companyHandle,
          ],
      );
      const job = result.rows[0];
  
      return job;
    }
  
    /** Find all jobs.
     *
     * Returns [{ id, title, salary, equity, company_handle }, ...]
     * */
  
    static async findAll() {
      const jobsRes = await db.query(
            `SELECT title,
             salary,
             equity,
             company_handle
             FROM jobs
             ORDER BY title`);
      return jobsRes.rows;
    }
  
    /** Allow API user to filter results by name and max/min number of employees; this function will only be called if user adds filters to query string */
    static async filterBy(filters) {
  
      // create empty array and initialize variable for use within scope of function
      console.log(filters);
      let allFilters = [];
      let selectedFilters;
      // loop through any selected filters; assign variable names to key & value for each
      for (let filter of filters) {
        let filterName = filter[0];
        let filterValue = filter[1];
        console.log(filterName, filterValue);
        // convert js to sql for each possible filter, modifying any value for name to use with iLIKE in query for case insensitivity and similar but not equal matches
        // push these into empty array allFilers
        if (filterName === "nameLike") {
          filterValue = `'%${filter[1]}%'`;
          allFilters.push(`name iLIKE ${filterValue}`);
        }
        if (filterName === "minEmployees") {
          filterValue = `${filter[1]}`;
          filterName = "num_employees";
          allFilters.push(`${filterName} >= ${filterValue}`);
        }
        if (filterName === "maxEmployees") {
          filterValue = `${filter[1]}`;
          filterName = "num_employees";
          allFilters.push(`${filterName} <= ${filterValue}`);
        }
        
        //  add "AND" between each WHERE clause in query string
        if (allFilters.length !== (2 * filters.length) - 1) {
          allFilters.push(`AND`);
        }
        //  remove commas and convert to string to complete SQL-friendly query
        selectedFilters = allFilters.join(' ');
        
        console.log(selectedFilters);
      }
      // complete the query, applying the selected filters and return the results
      const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies
         WHERE ${selectedFilters}
         ORDER BY name`);
  return companiesRes.rows;
    }
  
    /** Given a job id, return data about job.
     *
     * Returns { id, title, salary, equity, company_handle }
     *   where job is [{ id, title, salary, equity, companyHandle }, ...]
     *
     * Throws NotFoundError if not found.
     **/
  
    static async get(id) {
      const jobRes = await db.query(
                `SELECT title,
                salary,
                equity,
                company_handle
                FROM jobs
                WHERE id = $1`,
            [id]);
  
      const job = jobRes.rows[0];
  
      if (!job) throw new NotFoundError(`No job: ${id}`);
  
      return job;
    }
  
    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */
  
    static async update(id, data) {
      const { setCols, values } = sqlForPartialUpdate(
          data,
          { company_handle: 'companyHandle'});

      const idVarIdx = "$" + (values.length + 1);
  
      const querySql = `UPDATE jobs 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id, 
                                  title, 
                                  salary, 
                                  equity, 
                                  company_handle AS "companyHandle"`;
      const result = await db.query(querySql, [...values, id]);
      const job = result.rows[0];
  
      if (!job) throw new NotFoundError(`No job: ${id}`);
  
      return job;
    }
  
    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/
  
    static async remove(id) {
      const result = await db.query(
            `DELETE
             FROM jobs
             WHERE id = $1
             RETURNING id, title, company_handle as "companyHandle"`,
          [id]);
      const job = result.rows[0];
  
      if (!job) throw new NotFoundError(`No job: ${id}`);
    }
  }
  
  
  module.exports = Job;
