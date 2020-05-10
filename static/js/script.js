// IMPORTANT!! -> Change 'click' for 'touchend' to make it work on touchscreens
const nQuestions = Number($('#nquest').text())
const condition = Number($('#condition').text())
let currentQ, answers, times
let percentage = currentQ / nQuestions * 100
let id
let groupQ = false

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

function idgroupQ () {
  id = $(`#hidden-${currentQ}`).val()
  groupQ = $(`#group-ans-${currentQ}`).length
}

function setClickEventListeners () {
  for (let i = 0; i < nQuestions; i++) {
    $(`#group-ans-${i} > span > a`).off('click')
    $(`#group-ans-${i} > span > a`).on('click', getSelected)
    $(`#submit-${i}`).off('click')
    $(`#submit-${i}`).on('click', () => {
      $(`#submit-${i}`).off('click')
      getSelected()
    })
    // if ($(`#ans-${i}`).children()[child]) $(`#ans-${i}`).children()[child].value = ''
  }
  $('#agreed').on('click', () => {
    showInstructions()
  })
  $('#start').on('click', () => {
    startSurvey()
  })
  $('#continue').on('click', () => {
    $('#instructions-2').addClass('hide')
    nextQuestion()
    $(`#ques-${currentQ}`).fadeToggle('slow').promise().done(() => {
      $(`#${id}`).focus()
    })
  })
}

function showInstructions () {
  if (currentQ === 0) {
    $('#welcome').css('display', 'none')
    $('#instructions-1').removeClass('hide')
  } else {
    $('#instructions-2').removeClass('hide')
  }
}

function startSurvey () {
  idgroupQ()
  $('#instructions-1').css('display', 'none')
  $('#survey').css('display', '')
  $('#progressbar').parent().css('visibility', '')
  $(`#ques-${currentQ}`).fadeToggle('slow')
  $('#logos').css('visibility', 'hidden')
}

function getSelected () {
  let selected
  selected = $(`#${id}`).val()

  if (selected !== undefined) {
    if (!isNaN(selected)) selected = Number(selected)
    answers[id] = selected
  } else {
    $(`#group-ans-${currentQ} > span > a`).off('click')
    const key = $(this).parent()[0].id
    selected = $(this).text()
    if (selected !== '') {
      if (!isNaN(selected)) selected = Number(selected)
      answers[key] = selected
    } else {
      // TODO: Fix getting sliders values. This works on console, not here
      console.log($(`#${id} input`))
    }
  }

  if (id && id.substring(0, 3) === 'spr') {
    date = new Date()
    const elapsedT = date.getTime() - initialT
    times[`spr${currentQ}_ans`] = elapsedT
    initialT = undefined
    sprPos = 0
  }

  $(`#ques-${currentQ}`).fadeToggle('slow').promise().done(() => {
    if (currentQ !== 7) {
      nextQuestion()
      $(`#ques-${currentQ}`).fadeToggle('slow').promise().done(() => {
        $(`#${id}`).focus()
        if (currentQ === nQuestions) submitAnswers()
      })
    } else showInstructions()
  })
}

function nextQuestion () {
  currentQ++
  idgroupQ()
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

let sprPos = 0
let initialT
let date

$(document).ready(() => {
  $('textarea').characterCounter()
  initializeSurvey()
  $(document).on('keypress', (e) => {
    if (e.keyCode === 32 && id && id.includes('spr')) {
      if ($(`#spr${currentQ}_${sprPos}`).length || $(`#spr${currentQ}_${sprPos - 1}`).length) {
        $(`#spr${currentQ}_${sprPos}`).removeClass('hidden')
        date = new Date()
        if (!initialT) initialT = date.getTime()
        else {
          const elapsedT = date.getTime() - initialT
          times[`spr${currentQ}_${sprPos - 1}`] = elapsedT
          console.log(`Saved: spr${currentQ}_${sprPos - 1} = ${elapsedT}`)
          initialT = date.getTime()
          if (!$(`#spr${currentQ}_${sprPos}`).length) {
            $(`#ans-${currentQ}`).removeClass('hidden')
            $(`#submit-${currentQ}`).removeClass('hidden')
            $(`#${id}`).focus()
          }
        }
        sprPos++
      }
    }
  })
})
