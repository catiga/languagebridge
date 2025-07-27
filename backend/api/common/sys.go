package common

type ShowTag struct {
	ID   uint64 `json:"id"`
	Name string `json:"name"`
	Desc string `json:"desc"`
}

type SubmitTagRequest struct {
	Tags []uint64 `json:"tags"`
}
type WithTagRequest struct {
	ProvisionalToken string `json:"provisiontal_token"`
	UserNo           string `json:"user_no"`
	SubmitTagRequest
}
