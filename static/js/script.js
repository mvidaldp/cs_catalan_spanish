// IMPORTANT!! -> Change 'click' for 'touchend' to make it work on touchscreens
let currentQ
let timer
let answers = []
let ordered = []
let percentage = currentQ / nQuestions * 100
let uid = undefined
const PORT = '3000'


/**
 * Shuffle the elements of a given array, return the shuffled array.
 * @param {Array} arr - Given array
 * @return {Array} - Shuffled array
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1))
    let x = arr[i]
    arr[i] = arr[j]
    arr[j] = x
  }
  return arr
}

function initializeSurvey() {
  currentQ = 0
  answers = []
  ordered = []
  uid = undefined
  for (let i = 0; i < nQuestions; i++) ordered.push(i)
  for (let i = 0; i < nQuestions; i++) {
    let defaultVal = $(`ans-${i}`).prop('defaultValue')
    $(`ans-${i}`).val(defaultVal)
  }
  updateProgressBar()
  $('#progressbar').parent().css('visibility', 'hidden')
  $('#thanks').css('display', 'none')
  setClickEventListeners()
}

function setClickEventListeners() {
  $('#license > a').off('click')
  $('#license > a').on('click', getSelected)
  for (let i = 0; i < nQuestions; i++) {
    $(`#slider-next-${i}`).off('click')
    $(`#slider-next-${i}`).on('click', getSelected)
    $(`#group-ans-${i} > a`).off('click')
    $(`#group-ans-${i} > a`).on('click', getSelected)
    $(`#ans-${i}-submit`).off('click')
    $(`#ans-${i}-submit`).on('click', () => {
      if ($(`#ans-${i}`).val() !== '') {
        $(`#ans-${i}-submit`).off('click')
        getSelected()
      }
    })
    $(`#ans-${i}`).val('')
  }
}

function constantClickListeners() {
  for (let i = 0; i < 10; i++) $(`#digit-${i}`).on('click', () => inputDigit(i))
  $('#digit-delete').on('click', () => $('#id').val(''))
  for (let i = 0; i < nQuestions; i++) {
    for (let j = 0; j < 10; j++) {
      let idName = `#ans-${i}-d-${j}`
      $(idName).on('click', () => inputNum(`#ans-${i}`, j))
    }
    $(`#ans-${i}-d-delete`).on('click', () => $(`#ans-${i}`).val(''))
  }
  $('#start').on('click', () => {
    startSurvey()
  })
}

function startSurvey() {
  $('#instructions').css('display', 'none')
  $('#survey').css('display', '')
  $('#progressbar').parent().css('visibility', '')
  $(`#ques-${ordered[currentQ]}`).fadeToggle('slow')
  $('#logos').css('visibility', 'hidden')
}

function getSelected() {
  $(`#slider-next-${ordered[currentQ]}`).off('click')
  $(`#group-ans-${ordered[currentQ]} > a`).off('click')
  let selected = $(`#ans-${ordered[currentQ]}`).val()
  if (selected !== undefined) answers.push(selected)
  else {
    selected = $(this).html()
    answers.push(selected)
  }
  $(`#ques-${ordered[currentQ]}`).fadeToggle('slow').promise().done(() => {
    nextQuestion()
    $(`#ques-${ordered[currentQ]}`).fadeToggle('slow').promise().done(() => {
      if (currentQ === nQuestions) {
        submitAnswers()
      }
    })
  })
}

function nextQuestion() {
  currentQ++
  updateProgressBar()
}

function hideQuestions() {
  for (let i = 0; i < nQuestions; i++) $(`#ques-${i}`).css('display', 'none')
}

function updateProgressBar() {
  percentage = currentQ / nQuestions * 100
  $('#progressbar').css('width', percentage + '%')
}

function inputDigit(digit) {
  let content = $('#id').val()
  if (content.length < 2) $('#id').val(content + digit)
  else $('#id').val(digit)
}

function inputNum(elem, digit) {
  let content = $(elem).val()
  if (content.length < 2) $(elem).val(content + digit)
  else $(elem).val(digit)
}

function submitAnswers() {
  let responses = JSON.stringify(answers)
  $.post('/save', {
    answers: responses
  })
  $('#logos').css('visibility', '')
  $('#progressbar').parent().css('visibility', 'hidden')
  $('#thanks').fadeToggle('slow')
}

$(document).on('contextmenu', () => {
  return false // disable context menu
})

let current
let sprPos
$(document).ready(() => {
  // for (let i = 0; i < nQuestions; i++) {
  //   const found = $(`#input-field-ans-${i}`).children('input[type="checkbox"]')
  //   if (found) alert(`Age is in question number ${i}`)
  // }
  initializeSurvey()
  constantClickListeners()
  $(document).on('keypress', (e) => { // ask Moni if better keydown/keypress/keyup
    console.log(e.keyCode)
    if (e.keyCode === 32 && $(`#head-${currentQ}`).children().length > 0) {
      if (current !== currentQ) {
        current = currentQ
        sprPos = 0
      }
      else sprPos++
      $(`#spr${currentQ}_${sprPos}`).removeClass('hidden')
    }
    // TODO: make it check if question is SPR, space uncover phrase parts one by one
    // also fix getting age question number (for storing it as integer I guess)
  })
})
