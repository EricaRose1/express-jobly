const { BadRequestError } = require("../expressError");

/*
 sqlforpartialupdate- this function is to generate SQL query Strings for updating a db based on partial data
 that needs to be updated.
 If there is data to be updated the function generates an array of SQL query strings based on the mapping object
 and the function returns an object with two properties setCols and values
 
  * @param dataToUpdate {Object} {field1: newVal, field2: newVal, ...}
 * @param jsToSql {Object} maps js-style data fields to database column names,
 *   like { firstName: "first_name", age: "age" }
 *
 * @returns {Object} {sqlSetCols, dataToUpdate}
 *
 * @example {firstName: 'Aliya', age: 32} =>
 *   { setCols: '"first_name"=$1, "age"=$2',
 *     values: ['Aliya', 32] }
 */


function sqlForPartialUpdate(dataToUpdate, jsToSql) {

  const keys = Object.keys(dataToUpdate);
// const keys is an object that contains the data to be updated 
// checks if there are and things to be updated if not "No data"
  if (keys.length === 0) throw new BadRequestError("No data");

// jstosql is an object that maps js object to keys to SQL table column names
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    // setCols: (a string that contains SQL query for setting the column to be updated)
    setCols: cols.join(", "),
    // values: (an array of the values to be updated in the database.)
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
