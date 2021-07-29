const { BadRequestError } = require("../expressError");

/** Convert JS data to specific SQL data
 * 
 * Accepts data to be updated in the form of a dictionary where the keys 
 * will be changed. The jsToSql input is then converted to 
 * sql with guidance from the dataToUpdate columns.
 * 
 * Returns the columns of the table as a string and the values as
 * an array.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
