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
        "sap/m/MessageToast",
        'sap/ui/export/library',
        'sap/ui/export/Spreadsheet'
    ],
    function (BaseController, _dataModel, JSONModel, Fragment, syncStyleClass, FilterOperator, Filter, MessageBox, MessageToast, expLibrary, Spreadsheet) {
        "use strict";
        var that, oView;
        var EdmType = expLibrary.EdmType;
        return BaseController.extend("zsuppregs.controller.ManageSupp", {
            onInit: function () {
                that = this;
                oView = that.getView();
                var oImgModel = new JSONModel(
                    {
                        "logo": sap.ui.require.toUrl("zsuppregs/img/logo.png"),
                        "img": sap.ui.require.toUrl("zsuppregs/img/img.svg")

                    });
                that.getView().setModel(oImgModel, "img");
                that.oRouter = that.getOwnerComponent().getRouter(that);
                that.oRouter.getRoute("RouteSuppManage").attachMatched(that._onRouteMainMatched, that);
            },
            _onRouteMainMatched: function (oEvt) {
                that.status = oEvt.getParameter("arguments").currStatus;
                oView.setModel(new JSONModel({
                    "statusVisibility": that.status
                }), "vModel");

                var oPriceObj = _dataModel._getPriceDataStr();
                oView.setModel(new JSONModel([oPriceObj]), "oPriceModel");
            },
            onManageApplication: function (oEvt) {
                that.oRouter.navTo("RouteRegistration", {
                    currStatus: that.status
                });               
              
            },
            onAddPrice: function (oEvt) {
                debugger;
                oView.getModel("oPriceModel").getData().unshift(_dataModel._getPriceDataStr());
                oView.getModel("oPriceModel").refresh();
            },
            onDeletePrice: function (oEvt) {
                debugger;
                if (oView.byId("idPriceTable").getSelectedContextPaths().length > 0) {
                    var index = parseInt(oView.byId("idPriceTable").getSelectedContextPaths()[0].split("/")[1]);
                    oView.getModel("oPriceModel").getData().splice(index, 1);
                    oView.getModel("oPriceModel").refresh();
                } else {
                    sap.m.MessageBox.error("Please select an Item!", {
                        title: "Error",                                      // default
                        onClose: null,                                       // default
                        styleClass: "",                                      // default
                        actions: [MessageBox.Action.OK],                     // default
                        emphasizedAction: sap.m.MessageBox.Action.OK,        // default
                        initialFocus: null,
                        styleClass: "sapUiSizeCompact",                      // default
                        textDirection: sap.ui.core.TextDirection.Inherit,    // default
                        dependentOn: null                                    // default
                    }).addStyleClass("sapUiSizeCompact");
                }
            },
            createColumnConfig: function () {
                return [
                    {
                        label: 'SrNo',
                        property: 'srNo',
                        type: EdmType.Number,
                        scale: 0
                    },
                    {
                        label: 'ProductCode',
                        property: 'prdCode',
                        width: '25'
                    },
                    {
                        label: 'ProductDescription',
                        property: 'prdDesc',
                        width: '25'
                    },
                    {
                        label: 'CurrentPrice',
                        property: 'currPrice',
                        unitProperty: 'Currency',
                        width: '18'
                    },
                    {
                        label: 'Currency',
                        property: 'currency',
                        type: EdmType.Currency,
                        unitProperty: 'Currency',
                        width: '18'
                    },
                    {
                        label: 'UOM',
                        property: 'uom',
                        type: EdmType.String
                    },
                    {
                        label: 'ValidFrom',
                        property: 'fromDate',
                        type: EdmType.Date
                    },
                    {
                        label: 'ValidTo',
                        property: 'toDate',
                        type: EdmType.String
                    }];
            },

            _downloadPriceTemplate: function () {
                var aCols, oBinding, oSettings, oSheet, oTable;
                oTable = oView.byId('idPriceTable');
                aCols = that.createColumnConfig();

                oSettings = {
                    workbook: {
                        columns: aCols,
                        context: {
                            sheetName: 'Sheet1'
                        }
                    },
                    dataSource: new JSONModel([_dataModel._getPriceDataStr()]).getData(),
                    fileName: 'Price Management'
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {
                        MessageToast.show('Spreadsheet export has finished');
                    }).finally(function () {
                        oSheet.destroy();
                    });
            },
            onUploadExcelData: function (oEvent) {
                var oFileUploader = this.byId("priceUploader");
                var xlsDomRef = oFileUploader.getFocusDomRef();
                var xlsFile = oEvent.getParameter("files")[0];
                this.fileName = xlsFile.name;
                this.fileType = xlsFile.type;
                var oReader = new FileReader();
                oReader.onload = function (oReadStream) {
                    let data = [];
                    let xlsx_content = oReadStream.target.result;
                    let workbook = XLSX.read(xlsx_content, { type: 'binary' });
                    var excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets["Sheet1"]);
                    for (let i = 0; i < excelData.length; i++) {
                        debugger;
                        data.push(
                            {
                                "srNo": excelData[i].SrNo,
                                "prdCode": excelData[i].ProductCode,
                                "prdDesc": excelData[i].ProductDescription,
                                "currPrice": excelData[i].CurrentPrice,
                                "currency": excelData[i].Currency,
                                "uom": excelData[i].UOM,
                                "fromDate": new Date(excelData[i].ValidFrom),
                                "toDate": new Date(excelData[i].ValidTo)
                            });
                    }
                    oView.getModel("oPriceModel").setData(data);
                    oView.getModel("oPriceModel").refresh();
                };
                oReader.readAsBinaryString(xlsFile);
            },
        });
    });
