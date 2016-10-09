angular.module('yct-http-service', [])
    .factory('GetService', function ($q, $http, $location) {

        function HttpGet(url, params) {
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
    .factory('PostService', function ($q, $http, base64, $cookies, md5) {

        function HttpPost(url, json) {
            var defer = $q.defer();
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
                    defer.resolve(decodeData);
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


        function CardBindFun(op_type,card_num) {

            console.log('card_num:' + card_num);
            console.log('openid:' + $cookies.get('openid'));
            var jsonObj = {
                "card_num": card_num, "openid": $cookies.get('openid'), "op_type": op_type
            };
            var jsonStr = JSON.stringify(jsonObj);
            console.log('jsonStr:' + jsonStr);
            var mac = md5.createHash(jsonStr || '');
            mac = mac.substr(mac.length - 8, 8);
            console.log('mac:' + mac);

            var jsonMacObj = {
                "card_num": card_num, "openid": $cookies.get('openid'), "op_type": op_type, "mac": mac
            };

            return HttpPost('/wxapitest/cardBind', JSON.stringify(jsonMacObj));
        }

        return {
            CardBind: CardBindFun,
            CardQuery:CardBindFun
        }

    })
;