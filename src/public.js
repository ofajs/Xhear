const createXEle = (ele) => {
    return ele.__xEle__ ? ele.__xEle__ : (ele.__xEle__ = new XEle(ele));
}