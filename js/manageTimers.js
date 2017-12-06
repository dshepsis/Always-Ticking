'use strict';

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    function() {
      console.log("DOM loaded after JS.");
      whenOrIfPageLoaded();
    }
  );
} else {
  console.log("DOM loaded before JS.")
  whenOrIfPageLoaded();
}

function whenOrIfPageLoaded() {

function lastItem(arr) {
  return arr[arr.length-1];
}
function setLastItem(arr, value) {
  arr[arr.length-1] = value;
  return value;
}

class Timer {
  constructor(label) {
    this.label = label;
    this.durationAtLastStop = 0; //milliseconds
    this.startStopTimes = Object.freeze([]);
    this.started = false;
  }
  /* Returns a mutable copy of this instance's array of start and stop times: */
  cloneTimesArr() {
    const dupeTimes = [];
    for (const timePair of this.startStopTimes) {
      dupeTimes.push(timePair.slice(0));
    }
    return dupeTimes;
  }
  start() {
    if (this.started) {
      throw new Error(
        "Attempted to start a running timer! Timers " +
        "must be stopped before they can be started."
      );
    }
    this.started = true;
    const newTimes = this.cloneTimesArr();
    newTimes.push(Object.freeze([Date.now(), null]));
    this.startStopTimes = Object.freeze(newTimes);
    return this;
  }
  stop() {
    if (!this.started) {
      throw new Error(
        "Attempted to stop a stopped timer! Timers " +
        "must be started before they can be stopped."
      );
    }
    this.started = false;
    const newTimes = this.cloneTimesArr();
    const latestTimePair = Object.freeze([lastItem(newTimes)[0], Date.now()]);
    setLastItem(newTimes, latestTimePair);
    this.startStopTimes = Object.freeze(newTimes);
    this.durationAtLastStop += latestTimePair[1] - latestTimePair[0];
  }
  currentRunningDuration() {
    let runningTime = 0;
    if (this.started) {
      runningTime =  Date.now() - lastItem(this.startStopTimes)[0];
    }
    return runningTime + this.durationAtLastStop;
  }
}

/* A function for appending an array of children to a parent HTMLElement: */
function appendChildren(parent, children) {
  function appendItem(item) {
    if (item instanceof HTMLElement) {
      parent.appendChild(item);
    }
    /* Otherwise, coerce item into a string and make a text node out of it.
    * Then, append that text node to parent: */
    else {
      const text = document.createTextNode(String(item));
      parent.appendChild(text);
    }
  }
  if (Array.isArray(children)) {
    for (let i = 0, len = children.length; i < len; ++i) {
      appendItem(children[i]);
    }
  } else {
    appendItem(children);
  }
}
/* Makes an HTML element with content. This is similar to the
 * document.createElement() method, but allows text or other elements to
 * be added as a child in-place. Multiple children may be specified by
 * using an array. The optional attrObj parameter allows for attributes
 * such as id, class, src, and href to also be specified in-place.
 */
function makeElement(type, content, attrObj) {
  const newEle = document.createElement(type);
  if (content !== undefined) {
    appendChildren(newEle, content)
  }
  if (attrObj !== undefined) {
    for (const attribute in attrObj) {
     newEle.setAttribute(attribute, attrObj[attribute]);
    }
  }
  return newEle;
}
/* Removes all of an element's immediate children: */
function clearChildren(parent) {
  while (parent.firstChild !== null) {
    parent.removeChild(parent.firstChild);
  }
}

function breakIntoUnits(unitRatiosSmallToLarge, numOfSmallestUnit) {
  const numerators = [];
  let runningDividend = numOfSmallestUnit;
  for (const divisor of unitRatiosSmallToLarge) {
    const totalNumerator = Math.floor(runningDividend / divisor);
    const consumedDividend =  totalNumerator * divisor;
    const remainder = runningDividend - consumedDividend
    numerators.push(remainder);
    runningDividend = totalNumerator;
  }
  numerators.push(runningDividend);
  return numerators;
}

function msToSecMinHrs(ms) {
  return breakIntoUnits([1000, 60, 60], ms).slice(1);
}

function zeroPadNum(n, width=2) {
  const zeros = [];
  const nStr = n.toString();
  for (let i = width-nStr.length; i > 0; --i) {
    zeros.push(0);
  }
  zeros.push(nStr);
  return zeros.join('');
}

function makeTimeStr(ms) {
  const [secs, mins, hrs] = msToSecMinHrs(ms);
  return `${hrs}:${zeroPadNum(mins)}:${zeroPadNum(secs)}`
}

function timerToTableRow(timer) {
  const tr = makeElement('tr');
  const timePassed = makeElement(
    'td',
    makeTimeStr(timer.currentRunningDuration()),
    {class: "time-passed"}
  );
  const label = makeElement(
    'input',
    undefined,
    {
      type: 'text',
      class: "timer-label",
      value: timer.label
    }
  );
  let animationID;
  function timePassedAnim() {
    timePassed.innerHTML = makeTimeStr(timer.currentRunningDuration());
    animationID = requestAnimationFrame(timePassedAnim);
  }
  function startTimer() {
    tr.classList.add("active");
    timer.start();
    animationID = requestAnimationFrame(timePassedAnim);
  }
  function stopTimer() {
    tr.classList.remove("active");
    timer.stop();
    cancelAnimationFrame(animationID);
    timePassed.innerHTML = makeTimeStr(timer.currentRunningDuration());
  }
  appendChildren(tr, [timePassed, label]);
  return {element: tr, startTimer, stopTimer};
}


const timerData = ["Work", "Play", "Sleep"].map(
  label => ({timer: new Timer(label)})
);
const tableRows = [];
for (const timerDataObj of timerData) {
  console.log(timerData);
  const rowData = timerToTableRow(timerDataObj.timer)
  Object.assign(timerDataObj, rowData);
  tableRows.push(rowData.element);
}
const timerTable = document.getElementById('timer-table');
clearChildren(timerTable);
appendChildren(timerTable, tableRows);

function getIndexOfParentEle(childEle) {
  let runningIndex = 0;
  let prevSibling = childEle.previousElementSibling;
  while (prevSibling !== null) {
    ++runningIndex;
    prevSibling = prevSibling.previousElementSibling;
  }
  return runningIndex;
}

let activeTimerRow = null;
timerTable.addEventListener('click', function startClickedTimer(ev) {
  let rowClickedOn = ev.target;
  /* If the user did not click on or within a row of the table, do nothing: */
  if (rowClickedOn === timerTable) return;

  /* Otherwise, figure out which row of the table was clicked on, so that the
   * corresponding timer can be activated: */
  while (rowClickedOn.parentElement !== timerTable){
    rowClickedOn  = rowClickedOn.parentElement;
  }
  const activeRowIndex = getIndexOfParentEle(rowClickedOn);
  if (activeTimerRow !== null) activeTimerRow.stopTimer();
  const timerRowData = timerData[activeRowIndex];
  activeTimerRow = timerRowData;
  timerRowData.startTimer();
});
} //Close whenOrIfPageLoaded function
