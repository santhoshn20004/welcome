﻿app.controller('setting_setting', function ($scope, $attrs, $http, CommonSvc, SweetAlert, $compile) {
    var common = CommonSvc.getData($scope);

    $scope.onInit = function () {

    };

    $scope.Click_Update = function () {
        Data = {
            MeasurementID: $scope.ui.data.MeasurementID.Value,
            TrackingID: $scope.ui.data.TrackingID.Value
        };
        common.webApi.post('Setting/save', '', Data).then(function (Response) {
            $scope.Click_Cancel();
        });
    };



    $scope.Click_Cancel = function () {
        $(window.parent.document.body).find('[data-bs-dismiss="modal"]').click();
    };
});