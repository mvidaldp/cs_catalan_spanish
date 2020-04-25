// GLOBAL VARs
// requires
const express = require('express')
const bodyParser = require('body-parser')
// const https = require('https')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
const { google } = require('googleapis')
const gd = require('./gd-api.json')
const { GoogleSpreadsheet } = require('google-spreadsheet') // GoogleSpreadsheet
const creds = require('./service-account.json')
const sheetID = '1FDvm7eVe0z9jubFPmdUYLWIGqjNV_7P1w_A-Oo4bn8Y'
const doc = new GoogleSpreadsheet(sheetID)
const db = new sqlite3.Database('sqlite.db') // create and/or open the db

// express webserver
const app = express()
const port = 3000
let insertA = `INSERT INTO answers (
                  \`condition\`,
                  \`date\`,`
let insertT = `INSERT INTO answers (
                  \`condition\`,
                  \`date\`,`
// if err try to add ? before datetime for autoincrement (id)
let insertAend = 'VALUES (datetime("now", "localtime"),'
let insertTend = 'VALUES (datetime("now", "localtime"),'

const inHTML = []
const experiment = []

const sNames = {
  cond1: '',
  cond2: '',
  cond3: '',
  survey: ''
}

// FUNCTIONS
async function getSpreadSheet () {
  const drive = google.drive({
    version: 'v3',
    auth: gd.key
  })

  const request = await drive.files.get({ fileId: sheetID, fields: 'modifiedTime' })
  const modified = request.data.modifiedTime

  let timestamp
  try {
    if (fs.existsSync('./experiment.lastupdate')) {
      timestamp = fs.readFileSync('./experiment.lastupdate', 'utf8')
    } else {
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
      let toWrite = ''
      for (const [ix, row] of rows.entries()) {
        for (const [idx, h] of headers.entries()) {
          let cell = row[h]
          // if cell is not undefined take cell value without line breaks
          if (cell) {
            cell = cell.replace(/(\r\n|\n|\r)/gm, '')
            toWrite += cell
            if (idx < headers.length - 1) toWrite += '\t'
          }
        }
        if (ix < Object.keys(rows).length - 1) toWrite += '\n'
      }
      fs.writeFile(`./${sName}.tsv`, Buffer.from(toWrite, 'utf8'), (err) => {
        if (err) console.log(err)
      })
    }
    readFiles()
  } else readFiles()
}

function parseSurvey (data) {
  const survey = []
  const rows = data.split(/\r\n|\n/) // split by line
  // for all rows read from "questions"
  for (const r of rows) {
    let ans, step, sliders
    const row = r.split('\t')
    const type = row[2].trim()
    if (row[3].includes('-') && !row[3].includes('/')) ans = row[3].split('-')
    else if (row[3] && row[3].includes('/')) ans = row[3].split('/')
    if (row[4]) step = parseInt(row[4].trim())
    if (row[5]) sliders = parseInt(row[5].trim())
    if (type === 's') ans = ans.map(Number)
    survey.push({
      id: row[0].trim(),
      question: row[1].trim(),
      type: type,
      answers: ans,
      step: step,
      sliders: sliders
    })
  }
  return survey
}

function parseCondition (data) {
  const condition = []
  const rows = data.split(/\r\n|\n/) // split by line
  // for all rows read from "condition"
  for (const r of rows) {
    const row = r.split('\t')
    condition.push({
      id: row[0].trim(),
      question: row[1].trim(),
      type: row[2].trim()
    })
  }
  return condition
}
let nSpr
function readFiles () {
  const quest = fs.readFileSync('./questionnaire.tsv', 'utf8')
  const questions = parseSurvey(quest)
  for (let i = 1; i < 4; i++) {
    const cond = fs.readFileSync(`./condition${i}.tsv`, 'utf8')
    const condition = parseCondition(cond)
    nSpr = condition.length
    experiment.push(condition.concat(questions))
  }
  generateContent()
}
let maxSpr = 0
function generateContent () {
  for (const e in experiment) {
    inHTML[e] = ''
    for (let i = 0; i < experiment[e].length; i++) {
      let question = experiment[e][i].question
      if (experiment[e][i].type === 'o' && question !== 'Ciutat/estat') {
        let spr = question.replace(/[,.?]/g, (x) => { return `${x}#` })
        spr = spr.split('#')
        spr.pop() // better include a whitespace after the characters on replace
        if (spr.length > maxSpr) maxSpr = spr.length
        question = ''
        for (const [idx, part] of spr.entries()) {
          question += `<span id="spr${i}_${idx}" class="hidden">${part}</span>`
        }
      }
      inHTML[e] += `<div id="ques-${i}" class="col s12 content-height" style="display: none;">
                      <h6 id="head-${i}" class="header col s12 q-height">
                        ${question}
                      </h6>`
      if (experiment[e][i].type === 'a') {
        inHTML[e] += `<div id="ans-input-${i}" class="row center-align" style="margin-bottom: 0;">
                        <div id="input-field-ans-${i}" class="input-field col s12">
                          <div id="ans-${i}">
                            <i class="material-icons prefix">mode_edit</i>
                            <input type="number" id="${experiment[e][i].id}" class="materialize-textarea" min="1" max="100">
                          </div>
                          <button id="ans-${i}-submit" class="btn-large lighten-3">
                            <i class="material-icons">send</i>
                          </button>
                        </div>
                      </div>`
      } else if (experiment[e][i].type === 'o') {
        inHTML[e] += `<div id="ans-input-${i}" class="row center-align" style="margin-bottom: 0;">
                        <div id="input-field-ans-${i}" class="input-field col s12">
                          <div id="ans-${i}">
                            <i class="material-icons prefix">mode_edit</i>
                            <textarea id="${experiment[e][i].id}" class="materialize-textarea" data-length="500"></textarea>
                          </div>
                          <button id="ans-${i}-submit" class="btn-large lighten-3">
                            <i class="material-icons">send</i>
                          </button>
                        </div>
                      </div>`
      } else {
        inHTML[e] += `<div id="group-ans-${i}" class="col s12 a-height">`
        if (experiment[e][i].type === 's') {
          const min = experiment[e][i].answers[0]
          const max = experiment[e][i].answers[1]
          inHTML[e] += `<div class="valign-wrapper">
                          <div class="col s1 valign-wrapper">
                            <a class="btn-floating">${min}</a>
                          </div>
                          <form class="col s10" action="#">
                          <div class="valign-wrapper">
                            <p class="range-field col s12">
                              <div id="ans-${i}">
                                <input id="${experiment[e][i].id}" step="${experiment[e][i].step}" autocomplete="off"
                                type="range" min="${min}" max="${max}"
                                value="${parseInt(max / 2)}" />
                              </div>
                            </p>
                          </div>
                          </form>
                          <div class="col s1 valign-wrapper flex-row-reverse">
                            <a class="btn-floating">${max}</a>
                          </div>
                        </div>
                        <div class="valign-wrapper">
                          <button id="slider-${i}" class="btn-large lighten-3" style="margin: auto;">
                            <i class="large material-icons">send</i>
                          </button>
                        </div>`
        } else { // experiment[e][i].type === 'c'
          for (const ans of experiment[e][i].answers) {
            inHTML[e] += `<div id="ans-${i}">
                            <a id="${experiment[e][i].id}" class="btn-large lighten-3">${ans}</a>
                          </div>`
          }
        }
        inHTML[e] += '</div>'
      }
      inHTML[e] += '</div>'
    }
    inHTML[e] += '</div></div>'
  }
  createTables()
}

function createTables () {
  let createT = `CREATE TABLE IF NOT EXISTS times (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   date TEXT,
                   condition INTEGER,`
  let createA = `CREATE TABLE IF NOT EXISTS answers (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 date TEXT,
                 condition INTEGER,`

  // prepare create and insert answers and time queries
  for (let i = 0; i < experiment[0].length; i++) {
    let type
    switch (experiment[0][i].type) {
      case 'a':
      case 's':
        type = 'INTEGER'
        break
      case 'c':
      case 'o':
        type = 'TEXT'
        break
      default:
      // code block
    }
    createA += `\n${experiment[0][i].id} ${type},`
    insertA += `\n${experiment[0][i].id},`
    insertAend += '?, '
  }
  for (let i = 0; i < nSpr; i++) {
    for (let j = 0; j < maxSpr; j++) {
      createT += `\nspr${i}_${j} REAL,`
      insertT += `\nspr${i}_${j},`
      insertTend += '?, '
    }
  }

  createA = `${createA.substring(0, createA.length - 1)});`
  insertA = `${insertA.substring(0, insertA.length - 1)})\n${insertAend}`
  insertA = `${insertA.substring(0, insertA.length - 2)});`
  createT = `${createT.substring(0, createT.length - 1)});`
  insertT = `${insertT.substring(0, insertT.length - 1)})\n${insertTend}`
  insertT = `${insertT.substring(0, insertT.length - 2)});`
  console.log(createA)
  console.log(createT)
  // create answers and times tables (if none)
  db.run(createA)
  db.run(createT)
}

function serverRouting () {
  app.get('/', (req, res) => {
    const nConditions = experiment.length
    // pick a condition randomly
    const condition = Math.floor(Math.random() * nConditions)
    const nQuestions = experiment[condition].length
    console.log(`Condition: ${condition + 1}`)
    res.render('index', {
      content: inHTML[condition],
      nQuestions: nQuestions,
      condition: condition + 1
    })
  })

  app.post('/save', (req, res) => {
    let answers = req.body.answers
    const times = req.body.answers
    // TODO: look for a cleaner/nicer way to get this vars
    console.log('\nExperiment completed:')
    console.log(`Answers => ${answers}`)
    console.log(`Times => ${times}`)
    answers = answers.replace('[', '')
    answers = answers.replace(']', '')
    answers = answers.replace(/"/g, '')
    answers = answers.split(',')
    db.serialize(() => {
      db.run(insertA, answers)
      db.run(insertT, times)
    })
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
