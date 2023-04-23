"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const { checkAdmin, checkUserAdmin } = require("../middleware/auth");
const Job = require("../models/jobs");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
// const jobSearchSchema = require("../schemas/jobSearch.json");

const router = express.Router({ mergeParams: true });

// POST/ { job } => { job } job should be {title, salary, equity, companyHandle} 
// Returns{ id, title, salary, equity, companyHandle }
router.post("/", checkAdmin, checkUserAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});


// GET/ => {jobs: [{ id, title, salary, equity, companyHandle, companyName}, ...]}
router.get("/", async function (req, res, next) {
  try{
    const jobs = await Job.findAll(res.query);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

//   GET /[jobId] => {job} returns {id, title, salary, equity, comapny}
router.get("/:id", async function (req, res, next) {
    try {
      const job = await Job.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
});


// PATCH/ [jobId] include: { title, salary, equity, companyHandle }
router.patch("/:id", checkAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

// DELETE/ [handle] => { delete:id }
router.delete("/:id", checkAdmin, async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  });
  

  
module.exports = router;