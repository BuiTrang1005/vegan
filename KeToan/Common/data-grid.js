class LedgerDataGrid {
  constructor({ table, rows, columns, rowTemplate, onEdit, onDelete }) {
    this.table = typeof table === 'string' ? document.querySelector(table) : table
    if (!this.table) return
    this.rows = rows
    this.columns = columns
    this.rowTemplate = rowTemplate
    this.onEdit = onEdit
    this.onDelete = onDelete
    this.sort = { key: null, direction: 1 }
    this.hiddenColumns = new Set()
    this.selected = new Set()
    this.bind()
    this.render()
  }

  bind() {
    this.tbody = this.table.querySelector('tbody')
    this.selectAll = document.querySelector('[data-grid-select-all]')
    this.columnsButton = document.querySelector('[data-grid-columns]')
    this.columnsPanel = document.querySelector('[data-grid-columns-panel]')
    this.notice = document.querySelector('[data-grid-notice]')

    this.table.querySelectorAll('th[data-key]').forEach((header) => {
      header.draggable = true
      header.addEventListener('click', () => this.sortBy(header.dataset.key))
      header.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', header.dataset.key))
      header.addEventListener('dragover', (event) => event.preventDefault())
      header.addEventListener('drop', (event) => {
        event.preventDefault()
        this.moveColumn(event.dataTransfer.getData('text/plain'), header.dataset.key)
      })
    })

    this.selectAll?.addEventListener('change', () => {
      this.rows.forEach((row) => this.selectAll.checked ? this.selected.add(row.id) : this.selected.delete(row.id))
      this.render()
    })
    this.columnsButton?.addEventListener('click', () => {
      this.columnsPanel.hidden = !this.columnsPanel.hidden
    })
    document.querySelector('[data-grid-export]')?.addEventListener('click', () => this.exportExcel())
    document.querySelector('[data-grid-report]')?.addEventListener('click', () => this.report())
    document.querySelector('[data-grid-issued]')?.addEventListener('click', () => this.viewIssued())
    document.querySelector('[data-grid-add]')?.addEventListener('click', () => this.notify('Mở màn hình lập hóa đơn mới.'))
    document.querySelector('[data-grid-edit]')?.addEventListener('click', () => this.editSelected())
    document.querySelector('[data-grid-delete]')?.addEventListener('click', () => this.deleteSelected())
    document.querySelector('[data-grid-bulk-issued]')?.addEventListener('click', () => this.viewIssued(true))
    document.querySelector('[data-grid-bulk-report]')?.addEventListener('click', () => this.report(true))
  }

  sortBy(key) {
    this.sort = this.sort.key === key ? { key, direction: this.sort.direction * -1 } : { key, direction: 1 }
    this.render()
  }

  moveColumn(source, target) {
    if (!source || source === target) return
    const sourceIndex = this.columns.findIndex((column) => column.key === source)
    const targetIndex = this.columns.findIndex((column) => column.key === target)
    if (sourceIndex < 0 || targetIndex < 0) return
    const [column] = this.columns.splice(sourceIndex, 1)
    this.columns.splice(targetIndex, 0, column)
    this.render()
  }

  filteredRows() {
    return [...this.rows].sort((a, b) => {
      if (!this.sort.key) return 0
      return String(a[this.sort.key]).localeCompare(String(b[this.sort.key]), 'vi', { numeric: true }) * this.sort.direction
    })
  }

  render() {
    const visibleColumns = this.columns.filter((column) => !this.hiddenColumns.has(column.key))
    this.table.querySelector('thead tr').innerHTML = `<th class="check-cell"><input type="checkbox" data-grid-select-all aria-label="Chọn tất cả"></th>${visibleColumns.map((column) => `<th data-key="${column.key}" draggable="true">${column.label}<span class="sort-mark">${this.sort.key === column.key ? (this.sort.direction === 1 ? ' ↑' : ' ↓') : ' ↕'}</span></th>`).join('')}<th>Thao tác</th>`
    this.tbody.innerHTML = this.filteredRows().map((row) => `<tr data-row-id="${row.id}"><td class="check-cell"><input type="checkbox" data-row-select="${row.id}" ${this.selected.has(row.id) ? 'checked' : ''} aria-label="Chọn ${row.invoice}"></td>${visibleColumns.map((column) => `<td>${column.render ? column.render(row) : row[column.key]}</td>`).join('')}<td class="row-actions"><button class="row-action" data-row-view="${row.id}">Xem</button><button class="row-action" data-row-edit="${row.id}">Sửa</button></td></tr>`).join('') || `<tr><td colspan="${visibleColumns.length + 2}" class="empty-row">Không có dữ liệu phù hợp.</td></tr>`
    this.tbody.querySelectorAll('[data-row-select]').forEach((input) => input.addEventListener('change', () => input.checked ? this.selected.add(input.dataset.rowSelect) : this.selected.delete(input.dataset.rowSelect)))
    this.tbody.querySelectorAll('[data-row-view]').forEach((button) => button.addEventListener('click', () => this.viewIssued(false, button.dataset.rowView)))
    this.tbody.querySelectorAll('[data-row-edit]').forEach((button) => button.addEventListener('click', () => this.onEdit?.(this.rows.find((row) => row.id === button.dataset.rowEdit))))
    this.table.querySelectorAll('th[data-key]').forEach((header) => {
      header.addEventListener('click', () => this.sortBy(header.dataset.key))
      header.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', header.dataset.key))
      header.addEventListener('dragover', (event) => event.preventDefault())
      header.addEventListener('drop', (event) => { event.preventDefault(); this.moveColumn(event.dataTransfer.getData('text/plain'), header.dataset.key) })
    })
    this.selectAll = this.table.querySelector('[data-grid-select-all]')
    if (this.selectAll) {
      this.selectAll.checked = this.rows.length > 0 && this.selected.size === this.rows.length
      this.selectAll.addEventListener('change', () => {
        this.rows.forEach((row) => this.selectAll.checked ? this.selected.add(row.id) : this.selected.delete(row.id))
        this.render()
      })
    }
    this.renderColumnPanel()
  }

  renderColumnPanel() {
    if (!this.columnsPanel) return
    this.columnsPanel.innerHTML = this.columns.map((column) => `<label><input type="checkbox" data-column-toggle="${column.key}" ${this.hiddenColumns.has(column.key) ? '' : 'checked'}> ${column.label}</label>`).join('')
    this.columnsPanel.querySelectorAll('[data-column-toggle]').forEach((input) => input.addEventListener('change', () => { input.checked ? this.hiddenColumns.delete(input.dataset.columnToggle) : this.hiddenColumns.add(input.dataset.columnToggle); this.render() }))
  }

  selectedRows() { return this.rows.filter((row) => this.selected.has(row.id)) }
  editSelected() { const rows = this.selectedRows(); rows.length === 1 ? this.onEdit?.(rows[0]) : this.notify('Hãy chọn đúng một hóa đơn để sửa.') }
  deleteSelected() { const rows = this.selectedRows(); if (!rows.length) return this.notify('Hãy chọn ít nhất một hóa đơn để xóa.'); if (window.confirm(`Xóa ${rows.length} hóa đơn đã chọn?`)) { this.rows = this.rows.filter((row) => !this.selected.has(row.id)); this.selected.clear(); this.render(); this.notify('Đã xóa phiếu khỏi danh sách demo.') } }
  viewIssued(bulk, id) { const rows = id ? this.rows.filter((row) => row.id === id) : this.selectedRows(); this.notify(rows.length ? `Đang xem ${bulk ? rows.length + ' hóa đơn' : 'hóa đơn ' + rows[0].invoice} đã phát hành.` : 'Chọn hóa đơn đã phát hành để xem.') }
  report(bulk) { const rows = bulk ? this.selectedRows() : this.filteredRows(); this.notify(`Đã chuẩn bị báo cáo theo mẫu cho ${rows.length} hóa đơn.`) }
  exportExcel() { const rows = this.filteredRows(); const headers = this.columns.filter((column) => !this.hiddenColumns.has(column.key)).map((column) => column.label); const body = rows.map((row) => this.columns.filter((column) => !this.hiddenColumns.has(column.key)).map((column) => JSON.stringify(row[column.key] ?? '')).join(',')); const blob = new Blob(['\ufeff' + [headers.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'danh-sach-hoa-don.csv'; link.click(); URL.revokeObjectURL(link.href); this.notify('Đã xuất dữ liệu lưới theo các cột đang hiển thị.') }
  notify(message) { if (this.notice) { this.notice.textContent = message; this.notice.hidden = false; window.setTimeout(() => { this.notice.hidden = true }, 3200) } }
}

window.LedgerDataGrid = LedgerDataGrid
