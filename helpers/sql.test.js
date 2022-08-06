"use strict";
process.env.NODE_ENV = "test";

const {
  BadRequestError
} = require("../expressError");

const {sqlForPartialUpdate} = require("./sql");


// test function sqlForPartialUpdate
describe('sqlForPartialUpdate function', () => {

    // test function sqlForPartialUpdate on company model
    test('return object with company query data in correct format', () => {
        let dataToUpdate = {
            numEmployees: 99,
            name: "testCompany",
            description: "a company for testing",
            logoUrl: "http://www.testUrl.com"
        }
        let jsToSql = {
            numEmployees: "num_employees",
            logoUrl: "logo_url",
          }
        let queryObj = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(queryObj).toEqual({
            setCols: '"num_employees"=$1, "name"=$2, "description"=$3, "logo_url"=$4',
            values: [
              99,
              'testCompany',
              'a company for testing',
              'http://www.testUrl.com'
            ]
          });
    });



    // test function sqlForPartialUpdate on user model
    test('return object with user query data in correct format', () => {
        let dataToUpdate = {
            password: "testPassword",
            email: "email@test.com",
            isAdmin: true
        }
        let jsToSql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
          }
        let queryObj = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(queryObj).toEqual({
            setCols: '"password"=$1, "email"=$2, "is_admin"=$3',
            values: [
              'testPassword',
              'email@test.com',
              true
            ]
          });
    });


// test function sqlForPartialUpdate when no data exists

    test('throws error when no update data exists', () => {
        expect( () => {
            sqlForPartialUpdate(dataToUpdate, jsToSql);
        }).toThrow();
    });
});