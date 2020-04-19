// GLOBAL VARs
// requires
const express = require('express')
const bodyParser = require('body-parser')
// const internalIp = require('internal-ip')
const https = require('https')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
// const mysql = require('mysql')
const async = require('async')
const { google } = require('googleapis')
const gd = require('./gd-api.json')
const { GoogleSpreadsheet } = require('google-spreadsheet') // GoogleSpreadsheet
const creds = require('./service-account.json')
const sheetID = '1FDvm7eVe0z9jubFPmdUYLWIGqjNV_7P1w_A-Oo4bn8Y'
const doc = new GoogleSpreadsheet(sheetID)
// const IP = internalIp.v4.sync()
// let VRIP
// left raspberry pi => 192.168.1.3 checks left VR computer => 192.168.1.5
// right raspberry pi => 192.168.1.4 checks right VR computer => 192.168.1.6
// if (IP === '192.168.1.3') VRIP = '192.168.1.5'
// else VRIP = '192.168.1.6' // IP => 192.168.1.4
// database creation/connection
const db = new sqlite3.Database('sqlite.db') // create and/or open the db
// let sqlServerHost
// if (IP === '192.168.1.3' || IP === '192.168.1.4') sqlServerHost = '192.168.1.2'
// else sqlServerHost = 'localhost'
// const sql = mysql.createConnection({ // MySQL/MariaDB connection options
//   host: sqlServerHost,
//   user: 'driver',
//   password: 'VRlab',
//   database: 'westdrive'
// })
// sql.connect((err) => errorHandler(err)) // connect to MySQL/MariaDB
// express webserver
const app = express()
const port = 3000
let insertAns = `INSERT INTO answers (
                    \`uid\`,`
let insertA = `INSERT INTO answers (
                  \`id\`,
                  \`date\`,`
let insertAend = 'VALUES (?, datetime("now", "localtime"),'
const lNumpad = `<div id="input-id" class="col s12">
                  <div class="row center-align">
                    <button id="digit-1" class="btn numpad lighten-3">1</button>
                    <button id="digit-2" class="btn numpad lighten-3">2</button>
                    <button id="digit-3" class="btn numpad lighten-3">3</button>
                  </div>
                  <div class="row center-align">
                    <button id="digit-4" class="btn numpad lighten-3">4</button>
                    <button id="digit-5" class="btn numpad lighten-3">5</button>
                    <button id="digit-6" class="btn numpad lighten-3">6</button>
                  </div>
                  <div class="row center-align">
                    <button id="digit-7" class="btn numpad lighten-3">7</button>
                    <button id="digit-8" class="btn numpad lighten-3">8</button>
                    <button id="digit-9" class="btn numpad lighten-3">9</button>
                  </div>
                  <div class="row center-align">
                    <button id="digit-x" class="btn numpad lighten-3 hidden">
                    x
                    </button>
                    <button id="digit-0" class="btn numpad lighten-3">0</button>
                    <button id="digit-delete" class="btn numpad lighten-3">
                      <i class="material-icons">delete</i>
                    </button>
                  </div>`
const re = new RegExp('digit', 'g')
const numpad = lNumpad.replace('input-id', 'input-ans')
// https://docs.google.com/spreadsheets/d/1FDvm7eVe0z9jubFPmdUYLWIGqjNV_7P1w_A-Oo4bn8Y/edit#gid=0
// spreadsheet key is the long id in the sheets URL

let inHTML = ''
const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYwhILoTqeMwJFxgl\
TYOAQZdpeyvnCh_EVVQcHZWtlIpgZIO4ouFmkLclwyXl7HsJI_6xgEBB2JEiK/pub?output=tsv'
let experiment = []
let endingMessage
let id
let uid
let found = false
let ageID

// FUNCTIONS
function errorHandler(error) {
  if (error) throw error
  else return false
  return true
}

let sNames = {
  cond1: '',
  cond2: '',
  cond3: '',
  survey: ''
}
async function getSpreadSheet() {

  const drive = google.drive({
    version: 'v3',
    auth: gd.key
  })

  const request = await drive.files.get({ fileId: sheetID, fields: 'modifiedTime' })
  const modified = request.data.modifiedTime

  let timestamp
  try {
    if (fs.existsSync('./experiment.lastupdate'))
      timestamp = fs.readFileSync('./experiment.lastupdate', 'utf8')
    else {
      fs.createWriteStream('experiment.lastupdate')
      timestamp = undefined
    }
  } catch (err) {
    console.error(err)
  }
  console.log('\nExperiment last update:')
  console.log(`LOCAL  => ${timestamp}`)
  console.log(`ONLINE => ${modified}`)
  if (modified !== timestamp) {
    const file = fs.createWriteStream('experiment.lastupdate')
    file.write(modified)
    await doc.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: creds.private_key
    })
    await doc.loadInfo()
    // const cols = { cat: 'cathegory', q: 'question', s: 'slider', ans: 'answers', type: 'type'}
    for (let i = 0; i < doc.sheetCount; i++) {
      const sheet = doc.sheetsByIndex[i]
      const sName = sheet.title
      const rows = await sheet.getRows()
      await sheet.loadHeaderRow()
      const headers = sheet.headerValues
      const k = Object.keys(sNames)[i]
      sNames[k] = sName
      let to_write = ''
      for (const [ix, row] of rows.entries()) {
        for (const [idx, h] of headers.entries()) {
          let cell = row[h]
          // if cell is not undefined take cell value without line breaks
          if (cell) {
            cell = cell.replace(/(\r\n|\n|\r)/gm, '')
            to_write += cell
            if (idx < headers.length - 1) to_write += '\t'
          }
        }
        if (ix < Object.keys(rows).length - 1) to_write += '\n'
      }
      fs.writeFile(`./${sName}.tsv`, Buffer.from(to_write, 'utf8'), (err) => {
        if (err) console.log(err)
      })
    }
    readFiles()
  } else readFiles()
}

// function getLastUpdated() {
//   async.series([
//     function setAuth(step) {
//       doc.useServiceAccountAuth(creds, step)
//       // doc.useApiKey('394aa3cb294175cbb04bc7b0defaf8e4f67e93d6')

//     },
//     function getInfoAndWorksheets(step) {
//       console.log(doc.loadInfo())
//       doc.loadInfo((err, info) => {
//         let timestamp

//         try {
//           if (fs.existsSync('./survey.lastupdate'))
//             timestamp = fs.readFileSync('./survey.lastupdate', 'utf8')
//           else {
//             fs.createWriteStream('survey.lastupdate')
//             timestamp = undefined
//           }
//         } catch (err) {
//           console.error(err)
//         }
//         console.log('\nSurvey last update:')
//         console.log(`LOCAL  => ${timestamp}`)
//         console.log(`ONLINE => ${info.updated}`)
//         if (info.updated !== timestamp) {
//           const file = fs.createWriteStream('survey.lastupdate')
//           file.write(info.updated)
//           getFile()
//         } else readFile()
//         step()
//       })
//     }
//   ], (err) => {
//     if (err) {
//       console.log(`Unable to check the sheet file information:\n ${err}`)
//       readFile()
//     }
//   })
// }

function readFiles() {
  const rnd = Math.floor(Math.random() * 3) + 1
  console.log(`Condition: ${rnd}`)
  fs.readFile(`./condition${rnd}.tsv`, 'utf8', (err, cond) => {
    if (!errorHandler(err)) {
      fs.readFile('./questionnaire.tsv', 'utf8', (err, quest) => {
        if (!errorHandler(err)) {
          parseData(cond, quest)
        }
      })
    }
  })
}

function parseData(condition, questions) {
  let rows = condition.split(/\r\n|\n/) // split by line
  // for all rows read from "condition"
  for (let i = 0; i < rows.length; i++) {
    row = rows[i].split('\t')
    experiment.push({
      id: row[0].trim(),
      question: row[1].trim(),
      type: row[2].trim(),
    })
  }
  rows = questions.split(/\r\n|\n/) // split by line
  // for all rows read from "questions"
  for (let i = 0; i < rows.length; i++) {
    let ans = undefined
    let step = undefined
    let sliders = undefined
    row = rows[i].split('\t')
    let type = row[2].trim()
    if (row[3].includes('-') && !row[3].includes('/')) ans = row[3].split('-')
    else if (row[3] && row[3].includes('/')) ans = row[3].split('/')
    if (row[4]) step = parseInt(row[4].trim())
    if (row[5]) sliders = parseInt(row[5].trim())
    else slider = false
    if (type === 's') ans = ans.map(Number)
    experiment.push({
      id: row[0].trim(),
      question: row[1].trim(),
      type: type,
      answers: ans,
      step: step,
      sliders: sliders
    })
  }
  console.log(experiment)
  // endingMessage = survey[survey.length - 1].question
  // survey.pop()
  generateContent()
}

function generateContent() {
  inHTML = ''
  for (let i = 0; i < experiment.length; i++) {
    let head = `<h6 id="head-${i}" class="header col s12 q-height">
                  ${experiment[i].question}
                </h6>`
    inHTML += `<div id="ques-${i}" class="col s12 content-height"
                style="display: none;">`
    inHTML += head
    if (experiment[i].type === 'o' || experiment[i].type === 'a') {
      inHTML += `<div id="ans-input-${i}" class="row center-align" style="margin-bottom: 0;">
                    <div id="input-field-ans-${i}" class="input-field col s12">
                      <i class="material-icons prefix">mode_edit</i>
                      <textarea id="ans-${i}" class="materialize-textarea" data-length="500"></textarea>
                      <button id="ans-${i}-submit" class="btn-large lighten-3">
                        <i class="material-icons">send</i>
                      </button>
                    </div>
                  </div>`
    } else {
      inHTML += `<div id="group-ans-${i}" class="col s12 a-height">`
      if (experiment[i].type === 's') {
        const min = experiment[i].answers[0]
        const max = experiment[i].answers[1]
        inHTML += `<div class="valign-wrapper">
                    <div class="col s1 valign-wrapper">
                      <a class="btn-floating">${min}</a>
                    </div>
                    <form class="col s10" action="#">
                    <div class="valign-wrapper">
                      <p class="range-field col s12">
                        <input step="${experiment[i].step}" autocomplete="off" id="ans-${i}"
                        type="range" min="${min}" max="${max}"
                        value="${parseInt(max / 2)}" />
                      </p>
                    </div>
                    </form>
                    <div class="col s1 valign-wrapper flex-row-reverse">
                      <a class="btn-floating">${max}</a>
                    </div>
                  </div>
                  <div class="valign-wrapper">
                    <button id="slider-next-${i}" class="btn-large lighten-3"
                    style="margin: auto;">
                      <i class="large material-icons">send</i>
                    </button>
                  </div>`
      } else {
        if (experiment[i].type === 'c') {
          for (const ans of experiment[i].answers) {
            inHTML += `<a class="btn-large lighten-3">${ans}</a>`
          }
        }
      }
      inHTML += '</div>'
    }
    inHTML += '</div>'
  }
  inHTML += '</div></div>'
  createTables()
}

function createTables() {
  const createPart = `CREATE TABLE IF NOT EXISTS participants (
                      id TINYINT NOT NULL,
                      uid VARCHAR(36) NOT NULL,
                      date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      answered BOOLEAN NOT NULL DEFAULT 0)` // PKEY (id))
  const createP = `CREATE TABLE IF NOT EXISTS participants (
                   id text,
                   uid text,
                   date text,
                   answered integer);`
  let createAns = `CREATE TABLE IF NOT EXISTS answers (
                   id INT NOT NULL AUTO_INCREMENT,
                   uid VARCHAR(36) NOT NULL,
                   date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,`
  let createA = `CREATE TABLE IF NOT EXISTS answers (
                 id text,
                 date text,`
  // create participants table (if none)
  // sql.query(createPart, (err) => errorHandler(err)) // MySQL/MariaDB query
  db.run(createP) // same on SQLite db
  // prepare create and insert answers queries
  for (let i = 0; i < experiment.length; i++) {
    switch (experiment[i].type) {
      case 'num':
        createAns += `\n\`${experiment[i].id}\` TINYINT,`
        break
      case 'cat':
        createAns += `\n\`${experiment[i].id}\` VARCHAR(20),`
        break
      case 'bool':
        createAns += `\n\`${experiment[i].id}\` BOOLEAN,`
        break
    }
    createA += `\n"${experiment[i].id}" text,`
    insertAns += `\n\`${experiment[i].id}\`,`
    insertA += `\n"${experiment[i].id}",`
    insertAend += '?, '
  }
  createAns += 'PRIMARY KEY (id))'
  createA = `${createA.substring(0, createA.length - 2)});`
  insertAns = `${insertAns.substring(0, insertAns.length - 1)})\nVALUES ?`
  insertA = `${insertA.substring(0, insertA.length - 1)})\n${insertAend}`
  insertA = `${insertA.substring(0, insertA.length - 2)});`
  // sql.query(createAns, (err) => errorHandler(err))
  db.run(createA)
}

function serverRouting() {

  app.get('/', (req, res) => res.render('index', {
    content: inHTML,
    nQuestions: experiment.length,
    numpad: lNumpad,
    ageNum: ageID
    // ip: VRIP
  }))

  app.get('/check', (req, res) => {
    let iden = req.query.id
    let uiden = req.query.uid
    let create = `CREATE TABLE IF NOT EXISTS participants (
                  id text,
                  uid text,
                  date text,
                  answered integer);`
    let select = `SELECT * FROM participants
                  WHERE id = "${iden}"
                  and date >= datetime("now", "-1 Hour", "localtime")
                  and answered = "0";`
    let selectPart = `SELECT * FROM participants
                      WHERE id = ${parseInt(iden)}
                      and date >= NOW() - INTERVAL 1 HOUR
                      and answered = FALSE`
    // sql.query(selectPart, (err, result) => {
    //   errorHandler(err)
    //   if (result.length > 0) {
    //     result.forEach((row) => {
    //       console.log('\nExisting participant:')
    //       console.log(`ID  => ${iden}`)
    //       console.log(`UID => ${uiden}`)
    //       uiden = row.uid
    //     })
    //     res.send('exists')
    //   } else {
    //     let insertPart = `INSERT INTO participants (id, uid)
    //                       VALUES (${parseInt(iden)}, "${uiden}")`
    //     sql.query(insertPart, (err) => errorHandler(err))
    //     console.log('\nNew participant:')
    //     console.log(`ID  => ${iden}`)
    //     console.log(`UID => ${uiden}`)
    //     res.send('stored')
    //   }
    // })
    db.serialize(() => {
      db.run(create)
      db.all(select, (err, rows) => {
        errorHandler(err)
        if (rows.length === 0) {
          let insert = `INSERT INTO participants
                        VALUES ("${iden}", "${uiden}",
                        datetime("now", "localtime"), "0");`
          db.run(insert)
        }
      })
    })
  })

  app.post('/login', (req, res) => {
    id = req.body.id
    let iden = parseInt(id)
    let select = `SELECT * FROM participants
                  WHERE id = ${iden} and date >= NOW() - INTERVAL 1 HOUR
                  and answered = FALSE`
    // sql.query(select, (err, result) => {
    //   errorHandler(err)
    //   if (result.length > 0) {
    //     found = true
    //     result.forEach((row) => uid = row.uid)
    //     console.log('\nParticipant found:')
    //     console.log(`ID  => ${id}`)
    //     console.log(`UID => ${uid}`)
    //   } else {
    //     console.log(`\nThe participant ID = ${id} is not registered.`)
    //     found = false
    //     uid = undefined
    //   }
    //   res.json({
    //     uid: uid,
    //     found: found
    //   })
    // })
  })

  app.post('/save', (req, res) => {
    let answers = req.body.answers
    console.log('\nExperiment completed:')
    console.log(`ID      => ${id}`)
    console.log(`UID     => ${uid}`)
    console.log(`Answers => ${answers}`)
    answers = answers.replace('[', '')
    answers = answers.replace(']', '')
    answers = answers.replace(/"/g, '')
    answers = answers.split(',')
    for (let i = 0; i < experiment.length; i++) {
      switch (experiment[i].type) {
        case 'num':
          answers[i + 1] = parseInt(answers[i + 1])
          break
        case 'bool':
          if (answers[i + 1] === 'Nein') answers[i + 1] = false
          else answers[i + 1] = true
          break
      };
    }
    responses = [answers]
    // Also posssible to add err, result, fields
    // sql.query(insertAns, [responses], (err) => errorHandler(err))
    const updateP = `UPDATE participants
                     SET answered = 1
                     WHERE uid = "${uid}"`
    const update = `UPDATE participants
                    SET answered = "1"
                    WHERE uid ="${uid}";`
    // sql.query(updateP, (err) => errorHandler(err))
    db.serialize(() => {
      db.run(insertA, answers)
      db.run(update)
    })
    found = false
    uid = undefined
    id = undefined
    res.redirect('/')
  })
}

// CALLS
// express options
app.use('/static', express.static('static')) // use static folder
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())
app.set('view engine', 'ejs')
app.listen(port, () => console.log(`Server running on port ${port}...`))

// survey processing, database handling and server routing
// start survey generation process
getSpreadSheet()
serverRouting() // express server routing (GET and POST requests responses)
