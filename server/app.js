const express = require('express')
const app = express()
const port = 3001;
const cors = require("cors");
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const animalController = require("./controllers/animal.js")
const procedureController = require("./controllers/procedure.js")

app.use("/animal", animalController)
app.use("/procedure", procedureController)

app.get('/', (req, res) => {
    res.send('Hello world!')
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})



