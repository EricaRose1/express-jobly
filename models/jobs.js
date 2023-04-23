"use strict";

const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
// Returns {id, title, salary, equity, comapnyHandle}
    static async create(data) {
        const result = await db.query(`
                INSERT INTO jobs (title,
                                  salary,
                                  equity,
                                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
                [
                    data.title,
                    data.salary,
                    data.equity,
                    data.companyHandle
                ]);
        let job = result.rows[0];
        return job;
    }

    // Returns[{ id, title, salary, equity, companyHandle, companyName}, ...]
    static async findAll({minSalary, hasEquity, title} = {}) {
        let query = `SELECT j.id,
                            j.title,
                            j.salary,
                            j.equity,
                            j.company_handle AS "companyHandle",
                            c.name AS "companyName"
                    FROM jobs j 
                      LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    let exp = [];
    let queryVal = [];

    // For each possible search term, add to exp and
    // queryVal so we can generate the right SQL

    if (minSalary !== undefined) {
    queryVal.push(minSalary);
    exp.push(`salary >= $${queryVal.length}`);
    }

    if (hasEquity === true) {
    exp.push(`equity > 0`);
    }

    if (title !== undefined) {
    queryVal.push(`%${title}%`);
    exp.push(`title ILIKE $${queryVal.length}`);
    }

    if (exp.length > 0) {
    query += " WHERE " + exp.join(" AND ");
    }

    // Finalize query and return results

    query += " ORDER BY title";
    const jobsRes = await db.query(query, queryVal);
    return jobsRes.rows;   
  }


    // Returns { id, title, salary, equity, companyHandle, company } 
    // where company is { handle, name, description, numEmployees, logoUrl }
    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`, [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        const companiesRes = await db.query(
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
            FROM companies
            WHERE handle = $1`, [job.companyHandle]);

        delete job.companyHandle;
        job.company = companiesRes.rows[0];

        return job;
    }

    // Returns { id, title, salary, equity, companyHandle }
    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
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

    // Delete given job from database; returns undefined.
    static async remove(id) {
      const result = await db.query(
              `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`, [id]);
      const job = result.rows[0];
    
      if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;