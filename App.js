import React, { Component } from 'react';
import {
  AppRegistry,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';

import CodePush from "react-native-code-push";
import Progress from './CusProgressBar'
const {width, height} = Dimensions.get('window');
let SWidth, SHeight;
import update from './images/update.png';

if(height > width){
    SWidth = width;
    SHeight = height;
}else{
    SWidth = height;
    SHeight = width;
}

class App extends Component<{}> {
  constructor() {
    super();
    this.state = {
        restartAllowed: true,
        modalVisible: false,
        isSync: false,
        update: false,
        syncStatus: '',
        isMandatory: false,
        next: false,
        currProgress: 0.0,
        updateInfo: {}
    };
  }

  codePushStatusDidChange(syncStatus) {
    switch(syncStatus) {
      case CodePush.SyncStatus.CHECKING_FOR_UPDATE:
        this.setState({ modalVisible: true, syncMessage: "检测更新中..." });
        break;
      case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
//        this.setState({ syncMessage: "下载更新中..." });
        break;
      case CodePush.SyncStatus.AWAITING_USER_ACTION:
        this.setState({ syncMessage: "等待选择更新." });
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
        this.setState({ syncMessage: "安装成功,等待重启.", progress: false });
        break;
      case CodePush.SyncStatus.UNKNOWN_ERROR:
        this.setState({ syncMessage: "更新出错.", progress: false });
        break;
    }
  }

  codePushDownloadDidProgress(progress) {
    console.log("currProgress"+this.currProgress);
    this.currProgress = parseFloat(
      progress.receivedBytes / progress.totalBytes
      ).toFixed(2);
    if (this.currProgress >= 1) {
      console.log("更新完成");
      this.setState({ modalVisible: false });
    } else {
      console.log(this.refs.progressBar.progress);
      this.refs.progressBar.progress = this.currProgress;
    }
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


  sync() {
    if(!this.state.isSync){
      this.setState({isSync: true}, ()=>{
        CodePush.sync(
          {
//            // 更新安装时间
//            // CodePush.InstallMode.IMMEDIATE 立即安装并重启app
//            // CodePush.InstallMode.ON_NEXT_RESTART 下次启动app时安装
//            // CodePush.InstallMode.ON_NEXT_RESUME app从后台切换过来时安装
//            installMode: CodePush.InstallMode.IMMEDIATE
          },
          this.codePushStatusDidChange.bind(this),
          this.codePushDownloadDidProgress.bind(this)
        );
      });
    }
  }

   /** Update is downloaded silently, and applied on restart (recommended) */
  silentSync(){
    this.setState({isSync: true}, ()=>{
      CodePush.sync(
        {},
        this.codePushStatusDidChange.bind(this),
        this.codePushDownloadDidProgress.bind(this)
      );
      CodePush.allowRestart();
     });
  }

  /** Update pops a confirmation dialog, and then immediately reboots the app */
  syncImmediate() {
    CodePush.checkForUpdate().then(update => {
     console.log("检测更新" + update);
     if (!update) {
        this.setState({ syncMessage: "已是最新版本.", progress: false });
         //Toast.success("已是最新版本！");
     } else {
       this.setState({
         modalVisible: true, //弹出更新窗口
         updateInfo: update, //更新信息
         isMandatory: update.isMandatory //是否强制更新
       });
     }
   });
  }

  renderModal() {
      return (
      <Modal visible={this.state.modalVisible} transparent={true}>
          <View style={styles.modalContainer}>
              <View style={[{width: 0.8 * SWidth, marginBottom: 5}]}>
                  <Image source={update} style={{width: 0.8 * SWidth, height: 0.348 * SWidth}}/>
                  <View style={{backgroundColor: '#fff', width: 0.8 * SWidth, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, alignItems: 'center'}}>
                      <Text style={{color: '#2979FF', fontSize: 20, fontWeight: 'bold', justifyContent: 'center'}}>发现新版本</Text>
                      <View style={[{width: 0.8 * SWidth - 40, minHeight: 120}]}>
                          <Text style={{color: '#000', fontSize: 17, marginTop: 10}}>更新内容</Text>
                          <Text style={{color: '#999', fontSize: 16, marginTop: 10, lineHeight: 24, width: 0.8 * SWidth - 40}} >
                              {this.state.updateInfo.description}
                          </Text>
                      </View>
                      <View style={{marginBottom: 65}}/>
                      <View style={{
                          borderBottomLeftRadius: 5,
                          borderBottomRightRadius: 5,
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: '#eee',
                          height: 60, width: 0.8 * SWidth,
                          position: 'absolute', bottom: 0,
                          alignItems: 'center', justifyContent: 'center',
                      }}>
                          {this.state.update ? <TouchableOpacity  onPress={()=>{
                              console.log('--------点击---------立即安装更新-----------');
                              this.setState({modalVisible: false}, ()=>{
                                  CodePush.restartApp(true);
                              })
                          }} style={{height: 40, width: 0.5 * SWidth}}>
                              <View style={{height: 40, width: 0.5 * SWidth, flex: 1, alignItems: 'center', borderRadius: 20, justifyContent: 'center', backgroundColor: '#2979FF',}}>
                                  <Text style={{color: '#fff', }}>立即安装更新</Text>
                              </View>
                          </TouchableOpacity> : (this.state.isSync ? <View style={{height: 60, width: 0.8 * SWidth - 40, alignItems: 'center', justifyContent: 'center'}}>
                              <Progress ref="progressBar" progressColor={"#89C0FF"} style={{
                                          marginTop: 20,
                                          height: 10,
                                          width:width - 100,
                                          backgroundColor: "#5f8aff",
                                          borderRadius: 10}}/>
                              <Text style={{marginTop: 10, color: '#333'}}>下载更新包中</Text>
                          </View>:<View style={{
                              justifyContent: 'center', height: 60, width: 0.8 * SWidth,
                              alignItems: 'center',
                              flexDirection: 'row',
                          }}>
                              {this.state.isMandatory ? null : <TouchableOpacity  onPress={()=>{
                                  this.setState({modalVisible: false, next: true});
                                  console.log('--------点击---------稍后更新-----------');
                              }} style={{height: 40, maxWidth: 0.5 * SWidth, marginHorizontal: 10, flex: 1}}>
                                  <View style={{height: 40, maxWidth: 0.5 * SWidth, alignItems: 'center', borderRadius: 20, justifyContent: 'center', backgroundColor: '#eee', flex: 1}}>
                                      <Text style={{color: '#666', }}>稍后更新</Text>
                                  </View>
                              </TouchableOpacity>}
                              <TouchableOpacity  onPress={()=>{
                                  this.sync();
                              }} style={{height: 40, maxWidth: 0.5 * SWidth, marginHorizontal: 10, flex: 1}}>
                                  <View style={{height: 40, maxWidth: 0.5 * SWidth, alignItems: 'center', borderRadius: 20, justifyContent: 'center', backgroundColor: '#2979FF', flex: 1}}>
                                      <Text style={{color: '#fff', }}>{this.state.isMandatory ? '立即更新': '立即下载更新'}</Text>
                                  </View>
                              </TouchableOpacity>
                          </View>)}
                      </View>
                  </View>
              </View>
          </View>
      </Modal>
     )
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
        <TouchableOpacity onPress={this.silentSync.bind(this)}>
          <Text style={styles.syncButton}>后台更新</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.syncImmediate.bind(this)}>
          <Text style={styles.syncButton}>检测更新</Text>
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
          <View>
             {this.renderModal()}
          </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    paddingTop: 50
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    checkFrequency: CodePush.CheckFrequency.MANUAL,
    updateDialog: false
};

App = CodePush(codePushOptions)(App);

export default App;