import React, { Component } from 'react';
import {
  AppRegistry,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import CodePush from "react-native-code-push";

class App extends Component<{}> {
  constructor() {
    super();
    this.state = { restartAllowed: true };
  }

  codePushStatusDidChange(syncStatus) {
    switch(syncStatus) {
      case CodePush.SyncStatus.CHECKING_FOR_UPDATE:
        this.setState({ syncMessage: "检测更新中..." });
        break;
      case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
        this.setState({ syncMessage: "下载更新中..." });
        break;
      case CodePush.SyncStatus.AWAITING_USER_ACTION:
        this.setState({ syncMessage: "等待用户动作中..." });
        break;
      case CodePush.SyncStatus.INSTALLING_UPDATE:
        this.setState({ syncMessage: "安装更新中..." });
        break;
      case CodePush.SyncStatus.UP_TO_DATE:
        this.setState({ syncMessage: "已是最新版本.", progress: false });
        break;
      case CodePush.SyncStatus.UPDATE_IGNORED:
        this.setState({ syncMessage: "用户取消更新.", progress: false });
        break;
      case CodePush.SyncStatus.UPDATE_INSTALLED:
        this.setState({ syncMessage: "Update installed and will be applied on restart.", progress: false });
        break;
      case CodePush.SyncStatus.UNKNOWN_ERROR:
        this.setState({ syncMessage: "未知错误.", progress: false });
        break;
    }
  }

  codePushDownloadDidProgress(progress) {
    this.setState({ progress });
  }

  toggleAllowRestart() {
    this.state.restartAllowed
      ? CodePush.disallowRestart()
      : CodePush.allowRestart();

    this.setState({ restartAllowed: !this.state.restartAllowed });
  }

  getUpdateMetadata() {
    CodePush.getUpdateMetadata(CodePush.UpdateState.RUNNING)
      .then((metadata: LocalPackage) => {
        this.setState({ syncMessage: metadata ? JSON.stringify(metadata) : "Running binary version", progress: false });
      }, (error: any) => {
        this.setState({ syncMessage: "Error: " + error, progress: false });
      });
  }

  /** Update is downloaded silently, and applied on restart (recommended) */
  sync() {
    CodePush.sync(
      {},
      this.codePushStatusDidChange.bind(this),
      this.codePushDownloadDidProgress.bind(this)
    );
  }

  /** Update pops a confirmation dialog, and then immediately reboots the app */
  syncImmediate() {
    CodePush.sync(
      {
        // 更新安装时间
        // CodePush.InstallMode.IMMEDIATE 立即安装并重启app
        // CodePush.InstallMode.ON_NEXT_RESTART 下次启动app时安装
        // CodePush.InstallMode.ON_NEXT_RESUME app从后台切换过来时安装
        installMode: CodePush.InstallMode.IMMEDIATE,
        updateDialog: true
      },
      this.codePushStatusDidChange.bind(this),
      this.codePushDownloadDidProgress.bind(this)
    );
  }

  render() {
    let progressView;

    if (this.state.progress) {
      progressView = (
        <Text style={styles.messages}>{this.state.progress.receivedBytes} of {this.state.progress.totalBytes} bytes received</Text>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to CodePush!
        </Text>
        <TouchableOpacity onPress={this.sync.bind(this)}>
          <Text style={styles.syncButton}>后台更新</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.syncImmediate.bind(this)}>
          <Text style={styles.syncButton}>提示更新</Text>
        </TouchableOpacity>
        {progressView}
        <Image style={styles.image} source={require("./images/laptop_phone_howitworks.png")}/>
        <TouchableOpacity onPress={this.toggleAllowRestart.bind(this)}>
          <Text style={styles.restartToggleButton}>Restart { this.state.restartAllowed ? "allowed" : "forbidden"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.getUpdateMetadata.bind(this)}>
          <Text style={styles.syncButton}>Press for Update Metadata!!!</Text>
        </TouchableOpacity>
        <Text style={styles.messages}>{this.state.syncMessage || ""}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    paddingTop: 50
  },
  image: {
    margin: 30,
    width: Dimensions.get("window").width - 100,
    height: 365 * (Dimensions.get("window").width - 100) / 651,
  },
  messages: {
    marginTop: 30,
    textAlign: "center",
  },
  restartToggleButton: {
    color: "blue",
    fontSize: 17
  },
  syncButton: {
    color: "green",
    fontSize: 17
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 20
  },
});

/**
 * Configured with a MANUAL check frequency for easy testing. For production apps, it is recommended to configure a
 * different check frequency, such as ON_APP_START, for a 'hands-off' approach where CodePush.sync() does not
 * need to be explicitly called. All options of CodePush.sync() are also available in this decorator.
 */
let codePushOptions = {
    // 检查更新时间
    // CodePush.CheckFrequency.MANUAL 手动检查更新
    // CodePush.CheckFrequency.ON_APP_START 启动时检查更新
    // CodePush.CheckFrequency.ON_APP_RESUME 从后台切换回前台时检查更新
    checkFrequency: CodePush.CheckFrequency.MANUAL
};

App = CodePush(codePushOptions)(App);

export default App;