angular.module('yct-http-service', [])
    .factory('GetService', function ($q, $http, $location) {

        function HttpGet(url, params) {
            console.log('url = '+url);
            console.log('params = '+params);
            var defer = $q.defer();
            $http.get(url, {
                params: params,
                timeout: 20000
            }).then(function successCallback(response) {
                console.log('HttpGet successCallback');
                console.log(response);
                if (response.data.openid != undefined) {
                    defer.resolve(response.data);
                } else {
                    defer.reject('加载失败:' + response.data.errmsg);
                }
            }, function errorCallback(response) {
                console.log('HttpGet errorCallback');
                console.log(response);
                defer.reject('网络异常:' + response.status);
            });
            return defer.promise
        }

        function getOpenidFun() {

            return HttpGet('/wxapitest/wxopenid', {code: $location.search().code})
        }

        return {
            getOpenid: getOpenidFun
        }
    })
    .factory('PostService', function ($q, $http, base64, $cookies) {

        function HttpPost(url, json) {
            var defer = $q.defer();
            console.log('req url:' + url);
            $http.post(url, base64.encode(json), {
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8'
                    }
                }
            ).then(function successCallback(response) {
                console.log('HttpPost successCallback');
                console.log(response);
                var decodeData = base64.decode(response.data);
                console.log('resp json:' + decodeData);
                var jsonData = JSON.parse(decodeData);
                if (jsonData.status == 1) {
                    defer.resolve(jsonData);
                } else {
                    defer.reject('错误信息：' + jsonData.errmsg);
                }
            }, function errorCallback(response) {
                console.log('HttpPost errorCallback');
                console.log(response);
                defer.reject('网络异常:' + response.status);
            });
            return defer.promise
        }

        function calcMac(reqJsonObj) {
            var reqJsonStr = JSON.stringify(reqJsonObj);
            console.log('reqJsonStr:' + reqJsonStr);
            var mac = CryptoJS.MD5(reqJsonStr).toString();
            console.log('mac:' + mac);
            mac = mac.substr(mac.length - 8, 8);
            console.log('mac:' + mac);
            return mac;
        }


        function CardBindFun(op_type, card_num, card_remark) {
            //op_type:1 添加绑定关系
            //op_type:-1 删除绑定关系

            console.log('card_num:' + card_num);
            console.log('openid:' + $cookies.get('openid'));
            var reqJsonObj = {
                card_num: card_num, card_remark: card_remark, openid: $cookies.get('openid'), op_type: op_type
            };
            var mac = calcMac(reqJsonObj);
            reqJsonObj['mac'] = calcMac(reqJsonObj);

            return HttpPost('/wxapitest/cardBind', JSON.stringify(reqJsonObj));
        }

        function WxConfigFun(url, force) {
            console.log('url:' + url);
            console.log('force:' + force);
            var reqJsonObj = {
                "openid": $cookies.get('openid'), "url": url, "force": force
            };
            reqJsonObj['mac'] = calcMac(reqJsonObj);
            return HttpPost('/wxapitest/wxConfig', JSON.stringify(reqJsonObj));
        }

        function unifiedOrderFun(ordertype, card_num, productid, totalfee, nfc) {
            var reqJsonObj = {
                timestamp: Date.now(),
                platform: 1,
                userinfo: {
                    openid: $cookies.get('openid')
                },
                ordertype: ordertype,
                cardnum: card_num,
                productid: productid,
                totalfee: totalfee,
                nfc: nfc
            };
            reqJsonObj['mac'] = calcMac(reqJsonObj);
            return HttpPost('/wxapitest/unifiedOrder/create', JSON.stringify(reqJsonObj));
        }

        function paymentCreateFun(orderid) {
            var reqJsonObj = {
                timestamp: Date.now(),
                platform: 1,
                userinfo: {
                    openid: $cookies.get('openid')
                },
                orderid: orderid,
                paymenttype: "WX",
                wxParam: {
                    tradetype: "JSAPI"
                }
            };
            reqJsonObj['mac'] = calcMac(reqJsonObj);
            return HttpPost('/wxapitest/payment/create', JSON.stringify(reqJsonObj));
        }

        return {
            CardBind: CardBindFun,
            CardQuery: CardBindFun,
            WxConfig: WxConfigFun,
            UnifiedOrder: unifiedOrderFun,
            PaymentCreate: paymentCreateFun
        }

    })
;