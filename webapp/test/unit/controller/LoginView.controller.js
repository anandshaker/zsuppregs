/*global QUnit*/

sap.ui.define([
	"zsuppregs/controller/LoginView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("LoginView Controller");

	QUnit.test("I should test the LoginView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
