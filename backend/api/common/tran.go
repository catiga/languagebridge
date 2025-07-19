package common

type BookLeaveStatus string

type BookLeaveSource int

type BookTransStatus string

const (
	BookLeaveStatusApply     = "00"
	BookLeaveStatusRejected  = "10"
	BookLeaveStatusComfirmed = "20"

	BookLeaveSourceUser    = 0
	BookLeaveSourceTeacher = 1

	BookTransStatusNormal       = "000"
	BookTransStatusRequestLeave = "100"
)
