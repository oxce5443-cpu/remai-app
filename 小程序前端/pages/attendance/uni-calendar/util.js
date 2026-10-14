/**
 * uni-calendar 工具类
 * 用于日期计算和日历数据管理
 */
class Calendar {
	constructor({ date, selected, startDate, endDate, range } = {}) {
		this.date = this.getDateObj(date || this.getToday())
		this.selected = selected || []
		this.startDate = startDate || ''
		this.endDate = endDate || ''
		this.range = range || false
		this.multipleStatus = {
			before: '',
			after: '',
			data: []
		}
		this.weeks = []
		this._init()
	}

	_init() {
		this.weeks = this._getMonthWeeks(this.date.year, this.date.month)
	}

	getToday() {
		const now = new Date()
		const year = now.getFullYear()
		const month = String(now.getMonth() + 1).padStart(2, '0')
		const day = String(now.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	getDateObj(dateStr) {
		const parts = dateStr.split('-')
		const year = parseInt(parts[0])
		const month = parseInt(parts[1])
		const day = parseInt(parts[2])
		const date = new Date(year, month - 1, day)
		const week = date.getDay()
		return {
			year,
			month,
			date: day,
			day: day,
			week,
			fullDate: dateStr,
			lunar: this._getLunar(year, month, day)
		}
	}

	getDate(fullDate, offset, unit = 'day') {
		const parts = fullDate.split('-')
		const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
		if (unit === 'month') {
			date.setMonth(date.getMonth() + offset)
		} else {
			date.setDate(date.getDate() + offset)
		}
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return this.getDateObj(`${year}-${month}-${day}`)
	}

	setDate(fullDate) {
		this.date = this.getDateObj(fullDate)
		this._init()
	}

	getInfo(fullDate) {
		const obj = this.getDateObj(fullDate)
		obj.extraInfo = {}
		return obj
	}

	setSelectInfo(fullDate, selected) {
		this.selected = selected
		this._init()
	}

	_getMonthWeeks(year, month) {
		const weeks = []
		const firstDay = new Date(year, month - 1, 1)
		const lastDay = new Date(year, month, 0)
		const firstDayWeek = firstDay.getDay()
		const daysInMonth = lastDay.getDate()

		// Fill in previous month days
		const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
		let currentWeek = []

		for (let i = firstDayWeek - 1; i >= 0; i--) {
			const day = prevMonthLastDay - i
			const dateStr = this._formatDate(year, month - 1, day)
			currentWeek.push(this._buildDateItem(year, month - 1, day, dateStr, true))
		}

		// Fill in current month days
		for (let day = 1; day <= daysInMonth; day++) {
			const dateStr = this._formatDate(year, month, day)
			const item = this._buildDateItem(year, month, day, dateStr, false)
			currentWeek.push(item)

			if (currentWeek.length === 7) {
				weeks.push(currentWeek)
				currentWeek = []
			}
		}

		// Fill in next month days
		if (currentWeek.length > 0) {
			let nextDay = 1
			while (currentWeek.length < 7) {
				const dateStr = this._formatDate(year, month + 1, nextDay)
				currentWeek.push(this._buildDateItem(year, month + 1, nextDay, dateStr, true))
				nextDay++
			}
			weeks.push(currentWeek)
		}

		return weeks
	}

	_formatDate(year, month, day) {
		let y = year
		let m = month
		let d = day
		if (m < 1) { y--; m = 12 }
		if (m > 12) { y++; m = 1 }
		return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
	}

	_buildDateItem(year, month, day, fullDate, isOtherMonth) {
		const date = new Date(year, month - 1, day)
		const isSelected = this.selected.indexOf(fullDate) > -1
		const isToday = fullDate === this.getToday()
		const isStart = this.startDate && fullDate === this.startDate
		const isEnd = this.endDate && fullDate === this.endDate

		return {
			year,
			month,
			date: day,
			day,
			week: date.getDay(),
			fullDate,
			lunar: this._getLunar(year, month, day),
			disable: isOtherMonth,
			isDay: isToday,
			before: false,
			after: false,
			multiple: isSelected ? 'selected' : '',
			extraInfo: {}
		}
	}

	_getLunar(year, month, day) {
		// 简化的农历返回
		const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月',
			'七月', '八月', '九月', '十月', '冬月', '腊月']
		const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
			'十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
			'廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

		return {
			lunarMonth: lunarMonths[month - 1] || '',
			lunarDay: lunarDays[day - 1] || '',
			lunarYear: String(year)
		}
	}
}

export default Calendar
