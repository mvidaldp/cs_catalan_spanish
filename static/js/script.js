// IMPORTANT!! -> Change 'click' for 'touchend' to make it work on touchscreens
const nQuestions = Number($('#nquest').text())
const condition = Number($('#condition').text())
let currentQ, answers, times
let percentage = currentQ / nQuestions * 100
let id
let sprReady = true

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
  updateProgressBar()
  $('#progressbar').parent().css('visibility', 'hidden')
  setClickEventListeners()
}

function currentID () {
  id = $(`#hidden-${currentQ}`).val()
}

function setClickEventListeners () {
  for (let i = 0; i < nQuestions; i++) {
    const input = $(`#hidden-${i}`).val()
    const sliders = $(`#${input} input[type=range]`)
    const isSlider = sliders.length > 0
    const sumHundred = isSlider && sliders[0].max === '100'
    let sumsUp = true
    $(`#group-ans-${i} > span > a`).off('click')
    $(`#group-ans-${i} > span > a`).on('click', getSelected)
    $(`#submit-${i}`).off('click')
    $(`#submit-${i}`).on('click', () => {
      const value = $(`#${input}`).val()
      if (sumHundred) {
        let sum = 0
        for (let s = 0; s < sliders.length; s++) sum += Number(sliders[s].value)
        if (sum !== 100) sumsUp = false
        else sumsUp = true
      }
      if (!sumsUp) alert('La suma dels valors seleccionats ha de ser 100')
      else if ((isSlider || (value !== '' && value.trim() !== '' && value.length > 1)) && sumsUp) {
        $(`#submit-${i}`).off('click')
        getSelected()
      }
    })
  }
  $('#agreed').on('click', () => showInstructions())
  $('#start').on('click', () => startSurvey())
  $('#continue').on('click', () => {
    $('#instructions-2').addClass('hide')
    nextQuestion()
    $(`#ques-${currentQ}`).fadeToggle('fast').promise().done(() => $(`#${id}`).focus())
  })
}

function showInstructions () {
  if (currentQ === 0) {
    $('#welcome').css('display', 'none')
    $('#instructions-1').removeClass('hide')
  } else $('#instructions-2').removeClass('hide')
}

function startSurvey () {
  currentID()
  $('#instructions-1').css('display', 'none')
  $('#survey').css('display', '')
  $('#progressbar').parent().css('visibility', '')
  $(`#ques-${currentQ}`).fadeToggle('fast')
  $('#logos').css('visibility', 'hidden')
}

function getSelected () {
  const sliders = $(`#${id} input[type=range]`)
  if (sliders.length > 0) {
    for (let i = 0; i < sliders.length; i++) {
      const id = sliders[i].id
      const value = Number(sliders[i].value)
      answers[id] = value
    }
  } else {
    let selected
    selected = $(`#${id}`).val()
    if (selected !== undefined) {
      if (!isNaN(selected)) selected = Number(selected)
      else selected = selected.trim()
      answers[id] = selected
    } else {
      $(`#group-ans-${currentQ} > span > a`).off('click')
      const key = $(this).parent()[0].id
      selected = $(this).text()
      if (!isNaN(selected)) selected = Number(selected)
      answers[key] = selected
    }
  }

  if (id && id.substring(0, 3) === 'spr') {
    date = new Date()
    const elapsedT = date.getTime() - initialT
    times[`spr${currentQ}_ans`] = elapsedT
    initialT = undefined
    sprPos = 0
  }

  $(`#ques-${currentQ}`).fadeToggle('fast').promise().done(() => {
    if (currentQ !== 7) {
      nextQuestion()
      $(`#ques-${currentQ}`).fadeToggle('fast').promise().done(() => {
        if (id && id.includes('spr')) sprReady = true
        $(`#${id}`).focus()
        if (currentQ === nQuestions) submitAnswers()
      })
    } else showInstructions()
  })
}

function nextQuestion () {
  currentQ++
  currentID()
  updateProgressBar()
}

function updateProgressBar () {
  percentage = currentQ / nQuestions * 100
  $('#progressbar').css('width', percentage + '%')
}

function submitAnswers () {
  const responses = JSON.stringify(answers)
  const timings = JSON.stringify(times)
  $.post('save', {
    answers: responses,
    times: timings
  })
  // TODO: add/remove class hidden for visibility: hidden; enable/disable
  $('#logos').css('visibility', '')
  $('#progressbar').parent().css('visibility', 'hidden')
  $('#thanks').removeClass('hide')
}

function onlyNumbers () {
  const patt = new RegExp(/^[1-9][0-9]?$/)
  const match = patt.test($('#age').val())
  if (!match) $('#age').val('')
}

$(document).on('contextmenu', () => {
  return false // disable context menu
})

let sprPos = 0
let initialT
let date

$(document).ready(() => {
  $('textarea').characterCounter()
  initializeSurvey()
  $('#age').on('input', () => onlyNumbers())
  $(document).on('keypress', (e) => {
    if (e.keyCode === 32 && id && id.includes('spr')) {
      if (sprReady && ($(`#spr${currentQ}_${sprPos}`).length || $(`#spr${currentQ}_${sprPos - 1}`).length)) {
        $(`#spr${currentQ}_${sprPos}`).removeClass('hidden')
        date = new Date()
        if (!initialT) initialT = date.getTime()
        else {
          const elapsedT = date.getTime() - initialT
          times[`spr${currentQ}_${sprPos - 1}`] = elapsedT
          initialT = date.getTime()
          if (!$(`#spr${currentQ}_${sprPos}`).length) {
            $(`#spbar-${currentQ}`).addClass('hidden')
            $(`#ans-${currentQ}`).removeClass('hidden')
            $(`#submit-${currentQ}`).removeClass('hidden')
            $(`#${id}`).focus()
            sprReady = false
          }
        }
        sprPos++
      }
    }
  })
})
