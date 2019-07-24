/**
 * Magic Mirror
 * Module: MMM-Airtable
 *
 * By https://github.com/yashatgit/MMM-Airtable
 * MIT Licensed.
 */

//Module documentation: https://github.com/MichMich/MagicMirror/tree/master/modules
//Modules list: https://github.com/MichMich/MagicMirror/wiki/3rd-party-modules

const buildTableDOM = (tableData, tableConfig) => {
  const renderColumns = columns =>
    columns
      .map(
        columnName =>
          `<th class="bright ${
            tableConfig.rowBorder ? 'show-border' : ''
          }">${columnName}</th>`,
      )
      .join('');

  const renderRow = row =>
    row
      .map(
        cell =>
          `<td class="${
            tableConfig.rowBorder ? 'show-border' : ''
          }">${cell}</td>`,
      )
      .join('');

  return `
  <div class="mmt-atable-table-container">
    <header>${tableConfig.tableTitle || tableConfig.workspaceName}</header>
    <table class="mmt-atable-table">
        <tr>${renderColumns(tableData.columns)}</tr>${tableData.rows
    .map(row => `<tr>${renderRow(row)}</tr>`)
    .join('')}
    </table>
    </div>`;
};

const buildTableConfig = moduleConfig => {
  return moduleConfig.tables.reduce((acc, tableConfig, index) => {
    const tableId = index + 1;
    acc[tableId] = {
      updateInterval: moduleConfig.updateInterval,
      airtableAPIKey: moduleConfig.airtableAPIKey,
      airtableBaseId: moduleConfig.airtableBaseId,
      ...tableDefaults,
      ...tableConfig,
      tableId,
    };
    return acc;
  }, {});
};

const tableDefaults = {
  maxRows: 20,
  rowBorder: false,
};

Module.register('MMM-Airtable', {
  defaults: {
    updateInterval: 1000 * 60,
    animationSpeed: 1.5 * 1000,
  },

  getScripts: function() {
    return ['lodash.core.min.js'];
  },

  getStyles: function() {
    return ['MMM-airtable.css'];
  },

  start: function() {
    const self = this;
    Log.info('Now Starting module: ' + self.name);

    const tableConfigs = buildTableConfig(self.config);
    console.log({ tableConfigs });
    self.tableConfigs = tableConfigs;
    self.tableData = {};

    _.forEach(tableConfigs, tableConfig => {
      self.fetchTableData(tableConfig);
      setInterval(() => {
        self.fetchTableData(tableConfig);
      }, tableConfig.updateInterval);
    });
  },

  getDom: function() {
    const self = this;
    Log.info('Airtable getDom');
    const wrapper = document.createElement('div');
    const tableData = this.tableData;

    if (_.isEmpty(tableData)) {
      wrapper.className = 'small dimmed';
      wrapper.innerHTML = `Loading...`; //TODO
    } else {
      wrapper.setAttribute('id', 'MMM-airtable');
      wrapper.innerHTML = _.map(tableData, (data, tableId) =>
        buildTableDOM(data, self.tableConfigs[tableId]),
      ).join('');
    }

    return wrapper;
  },

  fetchTableData: function(tableConfig) {
    this.sendSocketNotification('MMM_AIRTABLE_DATA_FETCH', {
      tableConfig,
    });
  },

  socketNotificationReceived: function(notification, payload) {
    var self = this;
    if (notification === 'MMM_AIRTABLE_DATA_RECEIVED') {
      const { tableConfig, tableData } = payload;
      self.tableData[tableConfig.tableId] = tableData;
      self.updateDom(self.config.animationSpeed);
    }
  },
});
