'use strict';

class AdminRoutes {
  constructor (controller) {
    this.routes = [      
    {
      path: '/admin',
      method: 'post',
      controller: controller.admin(),
      auth: false,
    }
    ];
  }

  exportRoutes() {
    return this.routes;
  }

}

module.exports = AdminRoutes;