// IMPORTANT!! -> Change 'click' for 'touchend' to make it work on touchscreens
let currentQ
let timer
let answers = []
let ordered = []
let percentage = currentQ / nQuestions * 100
let uid = undefined
// const HOST = ip
const PORT = '3000'
// let side
// if (HOST === '192.168.1.5') side = 'Left'
// else side = 'Right'


// function updateVRstatus() {
//   const xhr = new XMLHttpRequest()
//   xhr.onreadystatechange = () => {
//     console.log(`Checking connection with WD-${side}...`)
//     if (xhr.readyState === 4) {
//       console.log('...')
//       if (xhr.status === 200) {
//         console.log(`WD-${side} is UP`)
//         $('#status-text').html('Das VR-Experiment ist bereit')
//         $('#status-icon').removeClass('yellow-text')
//         $('#status-icon').addClass('green-text')
//       } else {
//         console.log(`WD-${side} is DOWN`)
//         $('#status-text').html('Das VR-Experiment wird geladen')
//         $('#status-icon').removeClass('green-text')
//         $('#status-icon').addClass('yellow-text')
//       }
//     }
//   }
//   xhr.open('GET', `http://${HOST}:${PORT}/`, /*async*/ true)
//   xhr.send()
// }

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
  // unordered = []
  uid = undefined
  for (let i = 0; i < nQuestions; i++) ordered.push(i)
  // unordered = shuffleArray(ordered.slice())
  // let ageQind = unordered.indexOf(ageQnum)
  // unordered.splice(ageQind, 1)
  // unordered.splice(0, 0, ageQnum)
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
  // setQuestionTimer()
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
  // setQuestionTimer()
}

// function setQuestionTimer() {
//   clearTimeout(timer)
//   timer = setTimeout(() => goToLogin(), 60000)
// }

function hideQuestions() {
  for (let i = 0; i < nQuestions; i++) $(`#ques-${i}`).css('display', 'none')
}

// function goToLogin() {
//   $(`#ques-${ordered[currentQ]}`).fadeToggle('slow').promise().done(() => {
//     initializeSurvey()
//     hideQuestions()
//     startSurvey()
//   })
// }

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
  // clearTimeout(timer)
  // let ans = new Array(ordered.length)
  // for (let i = 0; i < ordered.length; i++) ans[ordered[i]] = answers[i + 1]
  // ans.unshift(answers[0])
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

$(document).ready(() => {
  initializeSurvey()
  constantClickListeners()
  // updateVRstatus()
  // setInterval(() => updateVRstatus(), 10000)
})
