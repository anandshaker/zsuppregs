sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "zsuppregs/util/_dataModel",
        "sap/ui/model/json/JSONModel",
        "sap/ui/core/Fragment",
        "sap/ui/core/syncStyleClass",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Filter",
        "sap/m/MessageBox",
        "sap/m/MessageToast"
    ],
    function (BaseController, _dataModel, JSONModel, Fragment, syncStyleClass, FilterOperator, Filter, MessageBox, MessageToast) {
        "use strict";
        var that, oView;
        return BaseController.extend("zsuppregs.controller.LoginView", {
            onInit: function () {
                that = this;
                that.sStatus = "New";
                oView = that.getView();
                var oImgModel = new JSONModel(
                    {
                        "logo": sap.ui.require.toUrl("zsuppregs/img/logo.png"),
                        "img": sap.ui.require.toUrl("zsuppregs/img/img.svg")

                    });
                that.getView().setModel(oImgModel, "img");
                that.oRouter = that.getOwnerComponent().getRouter(that);
                that.oRouter.getRoute("RouteLogin").attachMatched(that._onRouteMainMatched, that);
            },
            _onRouteMainMatched: function (oEvt) {
                // do nothing as of now               
            },
            handleSignUpPress: function () {
                that.oRouter.navTo("RouteRegistration", {
                    currStatus: "New"
                });
            },
            onEmailLiveChange: function (oEvt) {
                oEvt.getSource().setValueState("None");
                oEvt.getSource().setValueStateText("");
            },
            openSuppDashboard: function (oEvt) {
                var sUserID = oView.byId("eMail");
                var sUser = sUserID.getValue();

                var oBusy = new sap.m.BusyDialog();
                var oHanaModel = that.getOwnerComponent().getModel("hanaModel");
                var sPath = "/BusinessPartnerSet(UserID='" + sUser + "')";
                oBusy.open();
                oHanaModel.read(sPath, {
                    urlParameters: {
                        "$expand": "Partner"
                    },
                    success: function (oData) {
                        debugger;
                        oBusy.close();
                        that.getOwnerComponent().getModel("UserInfoModel").setProperty("/sUser", oData.UserID);
                        if (oData.Partner !== null && oData.Partner !== undefined) {
                            if (oData.Partner.ISDraft === 'X') {
                                that.sStatus = "Pending";
                            } else if (oData.Partner.ISDraft === 'A') {
                                that.sStatus = "Approved";
                            }
                        }
                        that.validateLogin(oData);
                    },
                    error: function (oError) {
                        debugger;
                        oBusy.close();
                        MessageToast.show("User not found !")
                        if (oError.statusText === 'Not Found') {
                            sUserID.setValueState("Warning");
                            sUserID.setValueStateText("Please enter a valid User!");
                            sUserID.setShowValueStateMessage(true);
                            sUserID.focus();
                        }
                    }
                });
                // that.navToSuppManage();
            },
            validateLogin: function (data) {
                var sPasswordID = oView.byId("passwrd");
                var sPassword = sPasswordID.getValue();
                if (sPassword === "" || sPassword === undefined) {
                    sPasswordID.setValueState("Warning");
                    sPasswordID.setValueStateText("Please enter the password!");
                    sPasswordID.setShowValueStateMessage(true);
                    sPasswordID.focus();
                } else if (sPassword !== data.Password) {
                    sPasswordID.setValueState("Warning");
                    sPasswordID.setValueStateText("Password is invalid!");
                    sPasswordID.setShowValueStateMessage(true);
                    sPasswordID.focus();
                } else if (sPassword === data.Password) {
                    that.navToSuppManage();
                }
            },
            navToSuppManage: function () {
                if (that.sStatus === "New") {
                    sap.m.MessageBox.alert("No Supplier Data found with this user in Database! Please register as new supplier ! ", {
                        title: "Alert",                                      // default
                        onClose: null,                                       // default
                        styleClass: "vPageBox",                              // default
                        actions: sap.m.MessageBox.Action.OK,                 // default
                        emphasizedAction: sap.m.MessageBox.Action.OK,        // default
                        initialFocus: null,                                  // default
                        textDirection: sap.ui.core.TextDirection.Inherit,    // default
                        dependentOn: null                                    // default
                    });
                } else {
                    that.oRouter.navTo("RouteSuppManage", {
                        currStatus: that.sStatus
                    });
                }
            }

        });
    }
);
