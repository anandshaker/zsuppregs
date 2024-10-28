sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/core/syncStyleClass",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
],
    function (Controller, JSONModel, Fragment, syncStyleClass, FilterOperator, Filter, MessageBox, MessageToast) {
        "use strict";
        return {
            _getCompanyDataStr: function () {
                return {
                    "Company": "",
                    "Address1": "",
                    "Address2": "",
                    "Country": "",
                    "City": "",
                    "State": "",
                    "ZipCode": ""
                }
            },
            _getContactDataStr: function () {
                return {
                    "IsDefault": false,
                    "firstName": "",
                    "middleName": "",
                    "lastName": "",
                    "Email": "",
                    "countryCode": "",
                    "Phone": "",
                    "wPhone": ""
                }
            },
            _getCatDataStr: function () {
                return {
                    "Category1": "",
                    "Category2": "",
                    "Category3": "",
                    "Category4": "",
                    "Category5": "",
                    "Category6": ""
                }
            },
            _getDocDataStr: function () {
                return {
                    "TradeDoc": "",
                    "VatDoc": "",
                    "EmiratesId": "",
                    "CorporateTax": ""
                }
            },
            _getDocStringDataStr: function () {
                return {
                    "TradeDoc": "",
                    "VatDoc": "",
                    "EmiratesId": "",
                    "CorporateTax": ""
                }
            },
            _getPriceDataStr: function () {
                return {
                    "srNo": "",
                    "prdCode": "",
                    "prdDesc": "",
                    "currPrice": "",
                    "currency": "",
                    "uom": "",
                    "fromDate": "",
                    "toDate": ""
                }
            }

        }
    });