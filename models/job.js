"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const Company = require("./company");

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   **/

  static async create({ title, salary, equity, company_handle }) {
    const result = await db.query(
          `INSERT INTO jobs
          (title, salary, equity, company_handle)
          VALUES ($1, $2, $3, $4)
          RETURNING id, title, salary, equity, company_handle`,
        [
          title,
          salary,
          equity,
          company_handle,
        ],
    );
    const job = result.rows[0];

    return job;
  }
  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   **/
  static async findAll({ title, minSalary, hasEquity } = {}) {
    let whereFilter = '';
    let parameters = [];
    let index = 1;
    let start = 'WHERE'
    if (title !== undefined) {
      whereFilter = `${start} title LIKE $${index} OR title LIKE $${index + 1}`;
      index = 3;
      start = ' AND';
      title = `%${title}%`;
      parameters = [title, title.toLowerCase()];
    } 
    if (minSalary !== undefined) {
      whereFilter = whereFilter + `${start} salary > $${index}`;
      index++;
      parameters.push(parseInt(minSalary));
    }
    if (hasEquity === true) {
      whereFilter = whereFilter + `${start} equity > 0`;
    }
    const jobResponse = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle
      FROM jobs
      ${whereFilter}
      ORDER BY title`, parameters);

    return jobResponse.rows;
  }

  /** Given a job id, return data about that job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const jobResponse = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle
          FROM jobs
          WHERE id = $1`,
        [id]);

    const job = jobResponse.rows[0];

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
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data,{});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols}
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary,
                                equity, 
                                company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];
    if (!job || job === undefined) throw new NotFoundError(`No job: ${id}`);

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
          RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;