// IMPORTANT!! -> Change 'click' for 'touchend' to make it work on touchscreens
const nQuestions = Number($('#nquest').text())
const condition = Number($('#condition').text())
let currentQ, answers, times
let percentage = currentQ / nQuestions * 100

/**
 * Shuffle the elements of a given array, return the shuffled array.
 * @param {Array} arr - Given array
 * @return {Array} - Shuffled array
 */
// function shuffleArray (arr) { // NOT USED, KEPT for DESCRIPTION
//   for (let i = arr.length - 1; i > 0; i--) {
//     let j = Math.floor(Math.random() * (i + 1))
//     let x = arr[i]
//     arr[i] = arr[j]
//     arr[j] = x
//   }
//   return arr
// }

function initializeSurvey () {
  currentQ = 0
  answers = {}
  times = {}
  answers.condition = condition
  times.condition = condition
  // NOT WORKING, CHECK
  // for (let i = 0; i < nQuestions; i++) {
  //   if ($(`#ans-${i}`).length) {
  //     let child = 0
  //     if ($(`#ans-${i}`).children().length > 1) child = 1
  //     const defaultVal = $(`ans-${i}`).children()[child].prop('defaultValue')
  //     $(`ans-${i}`).children()[child].value = defaultVal
  //   }
  // }
  updateProgressBar()
  $('#progressbar').parent().css('visibility', 'hidden')
  setClickEventListeners()
}

function setClickEventListeners () {
  for (let i = 0; i < nQuestions; i++) {
    $(`#slider-${i}`).off('click')
    $(`#slider-${i}`).on('click', getSelected)
    $(`#group-ans-${i} > span > a`).off('click')
    $(`#group-ans-${i} > span > a`).on('click', getSelected)
    $(`#ans-${i}-submit`).off('click')
    let child = 0
    if ($(`#ans-${i}`).children().length > 1) child = 1
    $(`#ans-${i}-submit`).on('click', () => {
      if ($(`#ans-${i}`).children()[child].value !== '') {
        $(`#ans-${i}-submit`).off('click')
        getSelected()
      }
    })
    if ($(`#ans-${i}`).children()[child]) $(`#ans-${i}`).children()[child].value = ''
  }
  $('#start').on('click', () => {
    startSurvey()
  })
}

function startSurvey () {
  $('#instructions').css('display', 'none')
  $('#survey').css('display', '')
  $('#progressbar').parent().css('visibility', '')
  $(`#ques-${currentQ}`).fadeToggle('slow')
  $('#logos').css('visibility', 'hidden')
}

function getSelected () {
  let child = 0
  if ($(`#ans-${currentQ}`).children().length > 1) {
    if ($(`#ans-${currentQ}`).children()[1].id) child = 1
    else child = 0
  }
  $(`#slider-${currentQ}`).off('click')
  $(`#group-ans-${currentQ} > span > a`).off('click')
  let selected, id
  if ($(`#ans-${currentQ}`).children()[child]) {
    selected = $(`#ans-${currentQ}`).children()[child].value
    id = $(`#ans-${currentQ}`).children()[child].id
    if (id.substring(0, 3) === 'spr') {
      date = new Date()
      const elapsedT = date.getTime() - initialT
      times[`spr${currentQ}_ans`] = elapsedT
    }
    $(`#ans-${currentQ} > textarea`)[0].focus()
  }
  if (selected !== undefined) {
    if (!isNaN(selected)) selected = Number(selected)
    answers[id] = selected
  } else {
    selected = $(this).text()
    id = $(this).parent()[0].id
    if (!isNaN(selected)) selected = Number(selected)
    answers[id] = selected
  }
  $(`#ques-${currentQ}`).fadeToggle('slow').promise().done(() => {
    nextQuestion()
    // if (id === 'age' || id === 'city') {
    //   console.log(id)
    //   $(`#ans-${currentQ} > textarea`).focus()
    // }
    $(`#ques-${currentQ}`).fadeToggle('slow').promise().done(() => {
      if (currentQ === nQuestions) submitAnswers()
    })
  })
}

function nextQuestion () {
  currentQ++
  updateProgressBar()
}

function updateProgressBar () {
  percentage = currentQ / nQuestions * 100
  $('#progressbar').css('width', percentage + '%')
}

function submitAnswers () {
  const responses = JSON.stringify(answers)
  const timings = JSON.stringify(times)
  $.post('/save', {
    answers: responses,
    times: timings
  })
  // TODO: add/remove class hidden for visibility: hidden; enable/disable
  $('#logos').css('visibility', '')
  $('#progressbar').parent().css('visibility', 'hidden')
  $('#thanks').removeClass('hide')
}

$(document).on('contextmenu', () => {
  return false // disable context menu
})

let current
let sprPos
let initialT
let date

$(document).ready(() => {
  $('textarea').characterCounter()
  initializeSurvey()
  $(document).on('keypress', (e) => {
    if (e.keyCode === 32 && $(`#head-${currentQ}`).children().length > 0) {
      if (current !== currentQ) {
        current = currentQ
        sprPos = 0
        date = new Date()
        initialT = date.getTime()
      } else {
        // console.log($(`#spr${currentQ}_${sprPos}`))
        if ($(`#spr${currentQ}_${sprPos + 1}`).length) {
          date = new Date()
          const elapsedT = date.getTime() - initialT
          initialT = date.getTime()
          // alert(elapsedT)
          times[`spr${currentQ}_${sprPos}`] = elapsedT
          sprPos++
        } else {
          $(`#ans-input-${currentQ}`).removeClass('hidden')
          $(`#ans-${currentQ} > textarea`)[0].focus()
          date = new Date()
          initialT = date.getTime()
        }
      }
      $(`#spr${currentQ}_${sprPos}`).removeClass('hidden')
    }
  })
})
