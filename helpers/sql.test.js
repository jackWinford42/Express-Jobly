const { sqlForPartialUpdate } = require("./sql");

describe("get sql data for a partial update", function() {
    test("should return the correct sql data", function() {
        const { setCols, values } = sqlForPartialUpdate(
        {
            name: "Bauer-Gallagher",
            numEmployees: 862,
            description: 'Difficult ready trip question produce produce someone.',
            logoUrl: '/logos/logo2.png'
        },
        {
            numEmployees: "num_employees",
            logoUrl: "logo_url",
        });
        expect(setCols).toEqual(`"name"=$1, "num_employees"=$2, "description"=$3, "logo_url"=$4`)
        expect(values).toEqual([
            'Bauer-Gallagher',
            862,
            'Difficult ready trip question produce produce someone.',
            '/logos/logo2.png'])
    })
})