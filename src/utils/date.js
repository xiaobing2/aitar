import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.locale('zh-cn')

export const formatDate = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export const formatRelative = (date) => {
  if (!date) return ''
  return dayjs(date).fromNow()
}

export const getTimeRemaining = (deadline) => {
  if (!deadline) return null
  
  const now = dayjs()
  const end = dayjs(deadline)
  const diff = end.diff(now)
  
  if (diff <= 0) {
    return { expired: true, text: '已过期' }
  }
  
  const duration = dayjs.duration(diff)
  const days = Math.floor(duration.asDays())
  const hours = duration.hours()
  const minutes = duration.minutes()
  
  if (days > 0) {
    return { expired: false, text: `${days}天${hours}小时` }
  } else if (hours > 0) {
    return { expired: false, text: `${hours}小时${minutes}分钟` }
  } else {
    return { expired: false, text: `${minutes}分钟` }
  }
}

export const isExpired = (deadline) => {
  if (!deadline) return false
  return dayjs(deadline).isBefore(dayjs())
}

export default dayjs

