const { BadRequestError } = require("../expressError");

// this function is called in the update method of both the user, company, and job models. It takes 2 arguments: 1.) dataToUpdate, which is the same as the data argument passed to the update method, and 2.) jsToSql, which is an object of the model properties with the keys represented in js syntax and the corresponding values represented in sql syntax (for those properties that require conversion).

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // create a variable, keys, that will hold all the properties that will be updated, taken from the dataToUpdate using the Object.keys() method.
  const keys = Object.keys(dataToUpdate);

  // send an error if no properties are selected to update.
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']

  // create a variable, cols, that holds an array of the properties/keys paired to an equal sign, dollar sign, and incrementing value to build parametized query. Any properties that are not in valid SQL syntax are changed from js to SQL here
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // turn the cols array into a comma-separated string and make this the value of a the setCols key
  // use Object.values() method to extract the desired values from dataToUpdate; make these the value of the values key
  // setCols and values are the variables in SQL update query on company and user models
  // return this object

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
