module.exports = {
  async mergeItBox(dialog, win) {
    return dialog.showMessageBox(win, {
      title: 'Merge files',
      type: 'info',
      buttons: ['Yes', 'No'],
      message: 'Do you want to merge the content of the folder to the exist playlist ?'
    });
  }
}
