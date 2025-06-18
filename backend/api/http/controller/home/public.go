package home

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langbridge/backend/api/common"
	"github.com/langbridge/backend/codes"
	"github.com/langbridge/backend/log"
	"github.com/langbridge/backend/model"
	"github.com/langbridge/backend/system"
)

func Public(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = struct {
		Rpc map[string]string `json:"rpc"`
	}{
		Rpc: map[string]string{
			"Solana":   "https://mainnet.helius-rpc.com/?api-key=4b1030d1-e346-4788-a65d-29c065efa012",
			"Ethereum": "https://eth.llamarpc.com",
			"Base":     "https://base-mainnet.infura.io/v3/15d81a19824c41159daec8327f691720",
			"Arbitrum": "https://arbitrum-mainnet.infura.io/v3/15d81a19824c41159daec8327f691720",
			"Bsc":      "https://binance.llamarpc.com",
		},
	}

	c.JSON(http.StatusOK, res)
}

func PublicCountries(c *gin.Context) {
	res := common.Response{}
	res.Timestamp = time.Now().Unix()

	db := system.GetDb()

	var countries []model.DictCountry
	err := db.Model(&model.DictCountry{}).Order("name asc").Find(&countries).Error

	if err != nil {
		log.Error("failed to fetch country data", err)
		res.Code = codes.CODE_ERR_DB_ERROR
		res.Msg = "failed to fetch country data"
		c.JSON(http.StatusOK, res)
		return
	}

	res.Code = codes.CODE_SUCCESS
	res.Msg = "success"
	res.Data = countries
	c.JSON(http.StatusOK, res)
}
