document.addEventListener('DOMContentLoaded', () => {
  const periodModal = document.getElementById('periodModal')
  const periodTrigger = document.getElementById('periodTrigger')
  const periodClose = document.getElementById('periodClose')
  const periodExit = document.getElementById('periodExit')
  const periodApply = document.getElementById('periodApply')
  const periodSelect = document.getElementById('periodSelect')
  const fiscalYearSelect = document.getElementById('fiscalYearSelect')

  const closePeriod = () => {
    if (periodModal) periodModal.hidden = true
  }

  if (periodModal && periodTrigger) {
    periodTrigger.addEventListener('click', () => {
      periodModal.hidden = false
      periodSelect?.focus()
    })
    periodClose?.addEventListener('click', closePeriod)
    periodExit?.addEventListener('click', closePeriod)
    periodModal.addEventListener('click', (event) => {
      if (event.target === periodModal) closePeriod()
    })
    periodApply?.addEventListener('click', () => {
      const label = periodTrigger.querySelector('b')
      if (label && periodSelect && fiscalYearSelect) {
        label.textContent = `Kỳ kế toán: ${periodSelect.value}/${fiscalYearSelect.value} - Năm tài chính ${fiscalYearSelect.value}`
      }
      closePeriod()
    })
  }

  const cashBars = document.getElementById('cashBars')
  if (cashBars) {
    const cashData = [['T11/23', 68, 42], ['T12', 76, 48], ['T01/24', 82, 55], ['T02', 78, 46], ['T03', 91, 61], ['T04', 101, 70], ['T05', 86, 58], ['T06', 96, 66], ['T07', 104, 73], ['T08', 108, 80], ['T09', 98, 72], ['T10 (Nay)', 112, 78]]
    cashBars.replaceChildren(...cashData.map(([month, income, outcome]) => {
      const group = document.createElement('div')
      group.className = 'bar-group'
      group.innerHTML = `<span class="bar revenue" style="height:${income}px" title="Thu: ${income} tỷ"></span><span class="bar expense" style="height:${outcome}px" title="Chi: ${outcome} tỷ"></span><em>${month}</em>`
      return group
    }))
  }

  document.querySelectorAll('.review').forEach((button) => {
    button.addEventListener('click', () => {
      button.textContent = 'Đã duyệt'
      button.classList.add('done')
    })
  })

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      document.querySelector('.search')?.focus()
    }
  })
})
