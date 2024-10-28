sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "zsuppregs/util/_dataModel",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/core/syncStyleClass",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator"
],
    function (Controller, _dataModel, JSONModel, Fragment, syncStyleClass, FilterOperator, Filter, MessageBox, MessageToast, BusyIndicator) {
        "use strict";
        var that, oView;
        return Controller.extend("zsuppregs.controller.NewRegistration", {
            onInit: function () {
                that = this;
                oView = that.getView();
                var oImgModel = new JSONModel(
                    {
                        "logo": sap.ui.require.toUrl("zsuppregs/img/logo.png"),
                        "img": sap.ui.require.toUrl("zsuppregs/img/img.svg")

                    });
                that.getView().setModel(oImgModel, "img");
                var oCModel = new JSONModel(sap.ui.require.toUrl("zsuppregs/localData/countries.json"));
                oCModel.setSizeLimit(999);
                this.getView().setModel(oCModel, "countriesModel");

                that.oRouter = that.getOwnerComponent().getRouter(that);
                that.oRouter.getRoute("RouteRegistration").attachMatched(that._onRouteMainMatched, that);

            },
            _onRouteMainMatched: function (oEvt) {
                debugger;
                that.pStatus = oEvt.getParameter('arguments').currStatus;
                oView.setModel(new JSONModel({
                    "validated": that.pStatus
                }), "validatedModel");
                that.upDateTradeFlag = false;
                that.updateVATFlag = false;
                that.updateEmiFlag = false;
                that.updateTaxFlag = false;

                if (that.pStatus === "New") {
                    //default model for company details
                    oView.byId("headerHTML").setContent('<h1 style="color: #004ea0;font-weight: bold;font-size: large;font-family: system-ui;">New Supplier Registration</h1>');
                    var oCcompanyObj = _dataModel._getCompanyDataStr();
                    oView.setModel(new JSONModel([oCcompanyObj]), "oCompanyModel");

                    //default model for contact details
                    var oContactObj = _dataModel._getContactDataStr();
                    oView.setModel(new JSONModel([oContactObj]), "oContactModel");

                    //default model for prod Categories
                    var oCategoryObj = _dataModel._getCatDataStr();
                    oView.setModel(new JSONModel([oCategoryObj]), "oCategoryModel");

                    //default model for documents upload
                    var oDocObj = _dataModel._getDocDataStr();
                    oView.setModel(new JSONModel([oDocObj]), "oDocumentModel");

                    //default model for documents base64
                    var oDocStrObj = _dataModel._getDocStringDataStr();
                    oView.setModel(new JSONModel(oDocStrObj), "oDocumentDataModel");

                    var oWizard = oView.byId("supplierWizard");
                    var _oNavContainer = oView.byId("wizardNavContainer");
                    var fnAfterNavigate = function () {
                        oWizard.goToStep(oWizard.getSteps()[0]);
                        oWizard.invalidateStep(oWizard.getSteps()[0]);
                        oWizard.invalidateStep(oWizard.getSteps()[1]);
                        _oNavContainer.detachAfterNavigate(fnAfterNavigate);
                    }.bind(that);
                    _oNavContainer.attachAfterNavigate(fnAfterNavigate);
                    _oNavContainer.backToPage(oView.byId("wizardContentPage"));
                    oWizard.discardProgress(oView.byId("supplierWizard").getSteps()[0]);

                    that.bindForms();
                } else if (that.pStatus === "Pending") {
                    oView.byId("headerHTML").setContent('<h1 style="color: #004ea0;font-weight: bold;font-size: large;font-family: system-ui;">Manage Application</h1>');

                    var sUser = that.getOwnerComponent().getModel("UserInfoModel").getProperty("/sUser");
                    var oBusy = new sap.m.BusyDialog();
                    var oHanaModel = that.getOwnerComponent().getModel("hanaModel");
                    var sPath = "/BusinessPartnerSet(UserID='" + sUser + "')";
                    oBusy.open();
                    oHanaModel.read(sPath, {
                        urlParameters: {
                            "$expand": "Partner,Company,Categories,ContactDetails,DocumentsTrade,DocumentsVAT,DocumentsEmi,DocumentsTax"
                        },
                        success: function (oData) {
                            that.createViewModels(oData);
                            oBusy.close();
                        },
                        error: function (oError) {
                            debugger;
                            oBusy.close();
                        }
                    });

                }
            },
            createViewModels: function (data) {
                debugger;
                var oSelectedIndex;
                var oCompanyObj = {
                    "Company": data.Company.CompanyName,
                    "Address1": data.Company.Address1,
                    "Address2": data.Company.Address2,
                    "Country": data.Company.Country,
                    "State": data.Company.State,
                    "City": data.Company.City,
                    "ZipCode": data.Company.POBox
                };
                oView.setModel(new JSONModel([oCompanyObj]), "oCompanyModel");
                oView.setModel(new JSONModel([data.Categories]), "oCategoryModel");
                var ContactDetails = [];
                data.ContactDetails.results.forEach(function (element, index) {
                    ContactDetails.push(
                        {
                            "firstName": element.FirstName,
                            "middleName": element.MiddleName,
                            "lastName": element.LastName,
                            "Email": element.Email,
                            "countryCode": element.CountryCode,
                            "Phone": element.MobileNumber,
                            "wPhone": element.WorkNumber,
                            "IsDefault": element.DefaultFlag === "X" ? true : false
                        }
                    );
                    if (ContactDetails[index].IsDefault) {
                        oSelectedIndex = index;
                    }
                });
                oView.setModel(new JSONModel(ContactDetails), "oContactModel");
                oView.byId("idContactTable").setSelectedItem(oView.byId("idContactTable").getItems()[oSelectedIndex]);
                oView.byId("idContactTableR").setSelectedItem(oView.byId("idContactTableR").getItems()[oSelectedIndex]);
                //default model for documents upload
                var oDocObj = _dataModel._getDocDataStr();
                if (data.DocumentsTrade.results.length > 0) {
                    oDocObj.TradeDoc = data.DocumentsTrade.results[data.DocumentsTrade.results.length - 1].fileName;
                }
                if (data.DocumentsEmi.results.length > 0) {
                    oDocObj.EmiratesId = data.DocumentsEmi.results[data.DocumentsEmi.results.length - 1].fileName;
                }
                if (data.DocumentsVAT.results.length > 0) {
                    oDocObj.VatDoc = data.DocumentsVAT.results[data.DocumentsVAT.results.length - 1].fileName;
                }
                if (data.DocumentsTax.results.length > 0) {
                    oDocObj.CorporateTax = data.DocumentsTax.results[data.DocumentsTax.results.length - 1].fileName;
                }
                oView.setModel(new JSONModel([oDocObj]), "oDocumentModel");
                //default model for documents base64
                var oDocStrObj = _dataModel._getDocStringDataStr();
                oView.setModel(new JSONModel(oDocStrObj), "oDocumentDataModel");

                var oWizard = oView.byId("supplierWizard");
                for (var i = 0; i < oWizard.getSteps().length - 1; i++) {
                    oWizard.nextStep();
                }
                that.bindForms();
            },
            bindForms: function () {
                oView.byId("idForm4").bindElement({
                    path: "/0",
                    model: "oCompanyModel"
                });
                oView.byId("idFormCat").bindElement({
                    path: "/0",
                    model: "oCategoryModel"
                });
                oView.byId("idFormCat2").bindElement({
                    path: "/0",
                    model: "oCategoryModel"
                });
                oView.byId("idDocForm").bindElement({
                    path: "/0",
                    model: "oDocumentModel"
                });
                // Review Page binding
                oView.byId("idForm4Review").bindElement({
                    path: "/0",
                    model: "oCompanyModel"
                });
                oView.byId("idFormCatR").bindElement({
                    path: "/0",
                    model: "oCategoryModel"
                });
                oView.byId("idFormCat2R").bindElement({
                    path: "/0",
                    model: "oCategoryModel"
                });
                oView.byId("idDocFormR").bindElement({
                    path: "/0",
                    model: "oDocumentModel"
                });
            },
            validateForm: function (sFieldFroupId) {
                var validate = true;
                var validateArr = [];
                $.each(sFieldFroupId, function (index, element) {
                    // debugger;
                    if (element.getMetadata()._sClassName === 'sap.m.Input' || element.getMetadata()._sClassName === 'sap.m.ComboBox') {
                        if (element.getValue() === "" || element.getValue() === undefined) {
                            // element.setValueState("Error");
                            validateArr.push(false);
                        } else {
                            // element.setValueState("None");
                            validateArr.push(true);
                        }
                    }
                });
                var validate = validateArr.toString().includes(false) ? false : true;
                return validate;
            },
            validateTable: function (sFieldFroupId) {
                debugger;
                var oContactModelData = oView.getModel("oContactModel").getData();
                var validate = true;
                var validateArr = [];
                Object.values(oContactModelData[0]).forEach(function (value) {
                    if (value === '' || value === undefined) {
                        validateArr.push(false);
                    } else {
                        validateArr.push(true);
                    }
                });
                if (oView.byId("idContactTable").getSelectedContextPaths().length === 0) {
                    validate = false;
                } else {
                    validate = validateArr.toString().includes(false) ? false : true;
                }
                return validate;
            },
            _onDefaultSelected: function (oEvt) {
                debugger;
                oView.getModel("oContactModel").getProperty(oEvt.getSource().getSelectedContextPaths()[0]).IsDefault = 'X';
                oView.getModel("oContactModel").refresh();
            },
            activateNextStep: function (oEvt) {
                debugger;
                var sFieldFroupId = [];
                var oWizard = oView.byId("supplierWizard");
                var bValidated = false;
                var currentIndex = oWizard.indexOfStep(oView.byId("supplierWizard")._getCurrentStepInstance());
                if (currentIndex === 0) {
                    sFieldFroupId = sap.ui.getCore().byFieldGroupId("compInfoForm");
                    bValidated = that.validateForm(sFieldFroupId);
                    bValidated ? oWizard.validateStep(oView.byId("supplierWizard")._getCurrentStepInstance()) : oWizard.invalidateStep(oView.byId("supplierWizard")._getCurrentStepInstance());
                } else if (currentIndex === 1) {
                    sFieldFroupId = sap.ui.getCore().byFieldGroupId("contactItem");
                    bValidated = that.validateTable(sFieldFroupId);
                    bValidated ? oWizard.validateStep(oView.byId("supplierWizard")._getCurrentStepInstance()) : oWizard.invalidateStep(oView.byId("supplierWizard")._getCurrentStepInstance());
                } else if (currentIndex === 2) {
                    sFieldFroupId = sap.ui.getCore().byFieldGroupId("catForm");
                    bValidated = that.validateForm(sFieldFroupId);
                    bValidated ? oWizard.validateStep(oView.byId("supplierWizard")._getCurrentStepInstance()) : oWizard.invalidateStep(oView.byId("supplierWizard")._getCurrentStepInstance());
                } else if (currentIndex === 3) {
                    sFieldFroupId = sap.ui.getCore().byFieldGroupId("doctForm");
                    bValidated = that.validateForm(sFieldFroupId);
                    bValidated ? oWizard.validateStep(oView.byId("supplierWizard")._getCurrentStepInstance()) : oWizard.invalidateStep(oView.byId("supplierWizard")._getCurrentStepInstance());
                }
            },
            onAddContact: function (oEvt) {
                debugger;
                if (oView.getModel("oContactModel").getData().length < 10) {
                    oView.getModel("oContactModel").getData().unshift(_dataModel._getContactDataStr());
                    oView.getModel("oContactModel").refresh();
                } else {
                    MessageToast.show("Maximum of 10 Contact Details can be added!")
                }
            },
            onDeleteContact: function (oEvt) {
                debugger;
                if (oView.byId("idContactTable").getSelectedContextPaths().length > 0) {
                    var index = parseInt(oView.byId("idContactTable").getSelectedContextPaths()[0].split("/")[1]);
                    oView.getModel("oContactModel").getData().splice(index, 1);
                    oView.getModel("oContactModel").refresh();
                } else {
                    sap.m.MessageBox.error("Please select an Item!", {
                        title: "Error",
                        onClose: null,
                        styleClass: "",
                        actions: [MessageBox.Action.OK],
                        emphasizedAction: sap.m.MessageBox.Action.OK,
                        initialFocus: null,
                        styleClass: "sapUiSizeCompact",
                        textDirection: sap.ui.core.TextDirection.Inherit,
                        dependentOn: null
                    }).addStyleClass("sapUiSizeCompact");
                }
            },
            wizardCompletedHandler: function (oEvt) {
                var oWizard = oView.byId("supplierWizard");
                var _oNavContainer = oView.byId("wizardNavContainer");
                _oNavContainer.to(oView.byId("wizardReviewPage"));
                if (oView.byId("idContactTable").getSelectedContextPaths().length > 0) {
                    var selectedIndex = parseInt(oView.byId("idContactTable").getSelectedContextPaths()[0].split("/")[1]);
                    oView.byId("idContactTableR").setSelectedItem(oView.byId("idContactTableR").getItems()[selectedIndex]);
                }
            },
            onNavBacktoWizard: function () {
                var _oNavContainer = oView.byId("wizardNavContainer");
                _oNavContainer.back();
            },
            handleWizardCancel: function () {
                MessageBox["warning"]("Are you sure you want to cancel your SignUp?", {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.YES) {
                            that._handleNavigationToStep(0);
                            oView.byId("supplierWizard").discardProgress(oView.byId("supplierWizard").getSteps()[0]);
                        }
                    }.bind(that)
                });
            },
            _handleNavigationToStep: function (iStepNumber) {
                that.clearRegistrationModel();
                var oWizard = oView.byId("supplierWizard");
                var _oNavContainer = oView.byId("wizardNavContainer");
                var fnAfterNavigate = function () {
                    oWizard.goToStep(oWizard.getSteps()[iStepNumber]);
                    oWizard.invalidateStep(oWizard.getSteps()[iStepNumber]);
                    oWizard.invalidateStep(oWizard.getSteps()[iStepNumber + 1]);
                    _oNavContainer.detachAfterNavigate(fnAfterNavigate);
                }.bind(that);
                _oNavContainer.attachAfterNavigate(fnAfterNavigate);
                _oNavContainer.backToPage(oView.byId("wizardContentPage"));
                that.navToLoginView();
            },
            clearRegistrationModel: function () {
                //default model for company details
                var oCcompanyObj = _dataModel._getCompanyDataStr();
                oView.getModel("oCompanyModel").setData([oCcompanyObj]);

                //default model for contact details
                var oContactObj = _dataModel._getContactDataStr();
                oView.getModel("oContactModel").setData([oContactObj]);

                //default model for prod Categories
                var oCategoryObj = _dataModel._getCatDataStr();
                oView.getModel("oCategoryModel").setData([oCategoryObj]);

                //default model for documents upload
                var oDocObj = _dataModel._getDocDataStr();
                oView.getModel("oDocumentModel").setData([oDocObj]);
            },
            navToLoginView: function () {
                that.oRouter.navTo("RouteLogin");
            },
            handleValueChange: function (oEvent) {
                debugger;
                var oSource = oEvent.getSource(),
                    mParameters = oEvent.getParameters(),
                    oFileObj = mParameters.files[0],
                    sFileType = oFileObj.type,
                    sBASE64_MAKER = 'data:' + sFileType + ';base64,',
                    oReader = new FileReader(),
                    sBase64Index;
                oReader.onload = (function () {
                    return function (oFileReader) {
                        sBase64Index = oFileReader.target.result.indexOf(sBASE64_MAKER) + sBASE64_MAKER.length;
                        if (oEvent.getSource().getId().includes("tradeDoc")) {
                            oView.getModel("oDocumentDataModel").setProperty("/TradeDoc", oFileReader.target.result);
                            if (that.pStatus === "Pending") {
                                that.upDateTradeFlag = true;
                            }
                            this.oAttachmentObjTrade = {
                                "BP": "Sumit",
                                "fileName": oFileObj.name,
                                "mediaType": sFileType,
                                "content": ""
                            };
                            this.oAttachmentObjTrade.content = oFileReader.target.result.substring(sBase64Index);
                        } else if (oEvent.getSource().getId().includes("vatDoc")) {
                            oView.getModel("oDocumentDataModel").setProperty("/VatDoc", oFileReader.target.result);
                            if (that.pStatus === "Pending") {
                                that.updateVATFlag = true;
                            }
                            this.oAttachmentObjVAT = {
                                "BP": "Sumit",
                                "fileName": oFileObj.name,
                                "mediaType": sFileType,
                                "content": ""
                            };
                            this.oAttachmentObjVAT.content = oFileReader.target.result.substring(sBase64Index);
                        } else if (oEvent.getSource().getId().includes("emiratesDoc")) {
                            oView.getModel("oDocumentDataModel").setProperty("/EmiratesId", oFileReader.target.result);
                            if (that.pStatus === "Pending") {
                                that.updateEmiFlag = true;
                            }
                            this.oAttachmentObjEmi = {
                                "BP": "Sumit",
                                "fileName": oFileObj.name,
                                "mediaType": sFileType,
                                "content": ""
                            };
                            this.oAttachmentObjEmi.content = oFileReader.target.result.substring(sBase64Index);
                        } else {
                            oView.getModel("oDocumentDataModel").setProperty("/CorporateTax", oFileReader.target.result);
                            if (that.pStatus === "Pending") {
                                that.updateTaxFlag = true;
                            }
                            this.oAttachmentObjTax = {
                                "BP": "Sumit",
                                "fileName": oFileObj.name,
                                "mediaType": sFileType,
                                "content": ""
                            };
                            this.oAttachmentObjTax.content = oFileReader.target.result.substring(sBase64Index);
                        }
                    }
                })(oFileObj).bind(this);
                oReader.readAsDataURL(oFileObj);
                that.activateNextStep();
            },
            handleUploadTrade: function (sUser) {
                debugger;
                var sSecToken;
                var oFileUploader = oView.byId("tradeDoc");
                var oDataModel = that.getOwnerComponent().getModel("hanaModel");
                var sServiceUrl = oDataModel.sServiceUrl;
                if (oFileUploader.getValue() === "") {
                    MessageToast.show("Please select a file");
                    oFileUploader.setValueState("Error");
                    return;
                }
                oDataModel.refreshSecurityToken(function () {
                    sSecToken = oDataModel.getSecurityToken();
                });
                oFileUploader.removeAllHeaderParameters();
                var oCustomerHeaderToken = new sap.ui.unified.FileUploaderParameter({
                    name: "x-csrf-token",
                    value: sSecToken
                });
                oFileUploader.addHeaderParameter(oCustomerHeaderToken);
                var oCustomerHeaderSlug = new sap.ui.unified.FileUploaderParameter({
                    name: "slug",
                    value: this.oAttachmentObjTrade.fileName
                });
                oFileUploader.addHeaderParameter(oCustomerHeaderSlug);
                oFileUploader.setSendXHR(true);
                // if (that.pStatus === "Pending") {
                //     oFileUploader.setHttpRequestMethod("PUT");
                // } else if (that.pStatus === "New") {
                oFileUploader.setHttpRequestMethod("POST");
                // }
                var sUrl = sServiceUrl + "/BusinessPartnerSet(UserID='" + sUser + "')/DocumentsTrade";
                oFileUploader.setUploadUrl(sUrl);
                oFileUploader.upload();
            },
            handleUploadVAT: function (sUser) {
                debugger;
                var sSecToken;
                var oFileUploader = oView.byId("vatDoc");
                var oDataModel = that.getOwnerComponent().getModel("hanaModel");
                var sServiceUrl = oDataModel.sServiceUrl;
                if (oFileUploader.getValue() === "") {
                    MessageToast.show("Please select a file");
                    oFileUploader.setValueState("Error");
                    return;
                }
                oDataModel.refreshSecurityToken(function () {
                    sSecToken = oDataModel.getSecurityToken();
                });
                oFileUploader.removeAllHeaderParameters();
                var oCustomerHeaderToken = new sap.ui.unified.FileUploaderParameter({
                    name: "x-csrf-token",
                    value: sSecToken
                });
                oFileUploader.addHeaderParameter(oCustomerHeaderToken);
                var oCustomerHeaderSlug = new sap.ui.unified.FileUploaderParameter({
                    name: "slug",
                    value: this.oAttachmentObjVAT.fileName
                });
                oFileUploader.addHeaderParameter(oCustomerHeaderSlug);
                oFileUploader.setSendXHR(true);
                // if (that.pStatus === "Pending") {
                //     oFileUploader.setHttpRequestMethod("PUT");
                // } else if (that.pStatus === "New") {
                oFileUploader.setHttpRequestMethod("POST");
                // }
                var sUrl = sServiceUrl + "/BusinessPartnerSet(UserID='" + sUser + "')/DocumentsVAT";
                oFileUploader.setUploadUrl(sUrl);
                oFileUploader.upload();
            },
            handleUploadEmirates: function (sUser) {
                debugger;
                var sSecToken;
                var oFileUploader = oView.byId("emiratesDoc");
                var oDataModel = that.getOwnerComponent().getModel("hanaModel");
                var sServiceUrl = oDataModel.sServiceUrl;
                if (oFileUploader.getValue() === "") {
                    MessageToast.show("Please select a file");
                    oFileUploader.setValueState("Error");
                    return;
                }
                oDataModel.refreshSecurityToken(function () {
                    sSecToken = oDataModel.getSecurityToken();
                });
                oFileUploader.removeAllHeaderParameters();
                var oCustomerHeaderToken = new sap.ui.unified.FileUploaderParameter({
                    name: "x-csrf-token",
                    value: sSecToken
                });
                oFileUploader.addHeaderParameter(oCustomerHeaderToken);
                var oCustomerHeaderSlug = new sap.ui.unified.FileUploaderParameter({
                    name: "slug",
                    value: this.oAttachmentObjEmi.fileName
                });
                oFileUploader.addHeaderParameter(oCustomerHeaderSlug);
                oFileUploader.setSendXHR(true);
                // if (that.pStatus === "Pending") {
                //     oFileUploader.setHttpRequestMethod("PUT");
                // } else if (that.pStatus === "New") {
                oFileUploader.setHttpRequestMethod("POST");
                // }
                var sUrl = sServiceUrl + "/BusinessPartnerSet(UserID='" + sUser + "')/DocumentsEmi";
                oFileUploader.setUploadUrl(sUrl);
                oFileUploader.upload();
            },
            handleUploadTax: function (sUser) {
                debugger;
                var sSecToken;
                var oFileUploader = oView.byId("taxDoc");
                var oDataModel = that.getOwnerComponent().getModel("hanaModel");
                var sServiceUrl = oDataModel.sServiceUrl;
                if (oFileUploader.getValue() === "") {
                    MessageToast.show("Please select a file");
                    oFileUploader.setValueState("Error");
                    return;
                }
                oDataModel.refreshSecurityToken(function () {
                    sSecToken = oDataModel.getSecurityToken();
                });
                oFileUploader.removeAllHeaderParameters();
                var oCustomerHeaderToken = new sap.ui.unified.FileUploaderParameter({
                    name: "x-csrf-token",
                    value: sSecToken
                });
                oFileUploader.addHeaderParameter(oCustomerHeaderToken);
                var oCustomerHeaderSlug = new sap.ui.unified.FileUploaderParameter({
                    name: "slug",
                    value: this.oAttachmentObjTax.fileName
                });
                oFileUploader.addHeaderParameter(oCustomerHeaderSlug);
                oFileUploader.setSendXHR(true);
                // if (that.pStatus === "Pending") {
                //     oFileUploader.setHttpRequestMethod("PUT");
                // } else if (that.pStatus === "New") {
                oFileUploader.setHttpRequestMethod("POST");
                // }
                var sUrl = sServiceUrl + "/BusinessPartnerSet(UserID='" + sUser + "')/DocumentsTax";
                oFileUploader.setUploadUrl(sUrl);
                oFileUploader.upload();
            },
            handleSaveSupplier: function () {
                var oCompanyData = oView.getModel("oCompanyModel").getData()[0];
                var oContactData = oView.getModel("oContactModel").getData();
                var oCategoryData = oView.getModel("oCategoryModel").getData()[0];
                var oEntry = {};
                var sUser = that.getOwnerComponent().getModel("UserInfoModel").getProperty("/sUser");
                oEntry.UserID = sUser;
                // oEntry.Password = "P@22c0de";
                if(that.pStatus==="New"){
                    oEntry.Partner = {
                        "PartnerId": "",
                        "ISDraft": "X"
                    };
                }
               
                oEntry.Company = {
                    "CompanyName": oCompanyData.Company,
                    "Address1": oCompanyData.Address1,
                    "Address2": oCompanyData.Address2,
                    "Country": oCompanyData.Country,
                    "State": oCompanyData.State,
                    "City": oCompanyData.City,
                    "POBox": oCompanyData.ZipCode
                };
                oEntry.Categories = oCategoryData;
                oEntry.ContactDetails = [];
                oContactData.forEach(function (element) {
                    oEntry.ContactDetails.push(
                        {
                            "FirstName": element.firstName,
                            "MiddleName": element.middleName,
                            "LastName": element.lastName,
                            "Email": element.Email,
                            "CountryCode": element.countryCode,
                            "MobileNumber": element.Phone,
                            "WorkNumber": element.wPhone,
                            "DefaultFlag": element.IsDefault === true ? 'X' : ''
                        }
                    )
                });
                // if (that.pStatus === "Pending") {
                that.updateToHanaDB(oEntry, sUser);
                // } else if (that.pStatus === "New") {
                //     that.saveToHanaDB(oEntry, sUser);
                // }

            },
            saveToHanaDB: function (oEntry, sUser) {
                var oBusy = new sap.m.BusyDialog();
                var oHanaModel = that.getOwnerComponent().getModel("hanaModel");
                oBusy.open();
                oHanaModel.create("/BusinessPartnerSet", oEntry, {
                    success: function (oData) {
                        debugger;
                        that.handleUploadTrade(sUser);
                        that.handleUploadEmirates(sUser);
                        that.handleUploadVAT(sUser);
                        that.handleUploadTax(sUser);
                        sap.m.MessageBox.success("Supplier Details has been saved as Draft!", {
                            title: "Success",
                            onClose: function (oEvt) {
                                that._handleNavigationToStep(0);
                                oView.byId("supplierWizard").discardProgress(oView.byId("supplierWizard").getSteps()[0]);
                            },
                            styleClass: "sapUiSizeCompact",
                            actions: sap.m.MessageBox.Action.OK,
                            emphasizedAction: sap.m.MessageBox.Action.OK,
                            initialFocus: null,
                            textDirection: sap.ui.core.TextDirection.Inherit,
                            dependentOn: null
                        });
                        oBusy.close();
                    },
                    error: function (oerror) {
                        MessageBox["error"](JSON.parse(oerror.responseText).error.message.value + " for this User !", {
                            title: "Error",
                            actions: sap.m.MessageBox.Action.OK,
                            onClose: null,
                            styleClass: "sapUiSizeCompact",
                            initialFocus: null,
                            textDirection: sap.ui.core.TextDirection.Inherit,
                            dependentOn: null
                        });
                        oBusy.close();
                        debugger;
                    }
                });
            },
            updateToHanaDB: function (oEntry, sUser) {
                var oBusy = new sap.m.BusyDialog();
                var oHanaModel = that.getOwnerComponent().getModel("hanaModel");
                oBusy.open();
                var sPath = "/BusinessPartnerSet(UserID='" + sUser + "')";
                oHanaModel.update(sPath, oEntry, {
                    success: function (oData) {
                        debugger;
                        if (that.pStatus === "Pending") {
                            if (that.upDateTradeFlag) {
                                that.handleUploadTrade(sUser);
                            }
                            if (that.updateVATFlag) {
                                that.handleUploadVAT(sUser);
                            }
                            if (that.updateEmiFlag) {
                                that.handleUploadEmirates(sUser);
                            }
                            if (that.updateTaxFlag) {
                                that.handleUploadTax(sUser);
                            }
                        } else {
                            that.handleUploadTrade(sUser);
                            that.handleUploadEmirates(sUser);
                            that.handleUploadVAT(sUser);
                            that.handleUploadTax(sUser);
                        }

                        sap.m.MessageBox.success("Supplier Details has been Updated!", {
                            title: "Success",
                            onClose: function (oEvt) {
                                that._handleNavigationToStep(0);
                                oView.byId("supplierWizard").discardProgress(oView.byId("supplierWizard").getSteps()[0]);
                            },
                            styleClass: "sapUiSizeCompact",
                            actions: sap.m.MessageBox.Action.OK,
                            emphasizedAction: sap.m.MessageBox.Action.OK,
                            initialFocus: null,
                            textDirection: sap.ui.core.TextDirection.Inherit,
                            dependentOn: null
                        });
                        oBusy.close();
                    },
                    error: function (oerror) {
                        MessageBox["error"](JSON.parse(oerror.responseText).error.message.value + " for this User !", {
                            title: "Error",
                            actions: sap.m.MessageBox.Action.OK,
                            onClose: null,
                            styleClass: "sapUiSizeCompact",
                            initialFocus: null,
                            textDirection: sap.ui.core.TextDirection.Inherit,
                            dependentOn: null
                        });
                        oBusy.close();
                        debugger;
                    }
                });
            },
            _downloadAttachments: function (oEvent) {
                if (oEvent.getSource().getId().includes("tradeBtn")) {
                    var oDoc = oView.getModel("oDocumentDataModel").getProperty("/TradeDoc");
                    var sName = oView.getModel("oDocumentModel").getData()[0].TradeDoc;
                } else if (oEvent.getSource().getId().includes("vatBtn")) {
                    var oDoc = oView.getModel("oDocumentDataModel").getProperty("/VatDoc");
                    var sName = oView.getModel("oDocumentModel").getData()[0].VatDoc;
                } else if (oEvent.getSource().getId().includes("emiBtn")) {
                    var oDoc = oView.getModel("oDocumentDataModel").getProperty("/EmiratesId");
                    var sName = oView.getModel("oDocumentModel").getData()[0].EmiratesId;
                } else {
                    var oDoc = oView.getModel("oDocumentDataModel").getProperty("/CorporateTax");
                    var sName = oView.getModel("oDocumentModel").getData()[0].CorporateTax;
                }
                that.downloadFile(oDoc, sName);
            },
            downloadFile: function (oFile, sName) {
                const linkSource = oFile;
                const downloadLink = document.createElement("a");
                const fileName = sName;
                downloadLink.href = linkSource;
                downloadLink.download = fileName;
                downloadLink.click();
            }
        });
    });
