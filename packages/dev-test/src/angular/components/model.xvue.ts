import {
  Component,
} from "vue-plus";
import type { LifecycleHook } from "vue-plus";
import { EventEmitter, Model, ModelMetaEmitter, ModelModifiers, ModelParams, Output } from "vue-plus/output";

@Component({
  styleUrls: ["./demo.less"],
  components: [
  ],
  template: `
    <div>{{ model }}</div>
    <div>{{ modelParams }}</div>
    <button @click="modelChange">modelChange</button>
    <button @click="modelParamsChange">modelParamsChange</button>
  `,
})
export default class AngularChild implements LifecycleHook {
  f?: string;
  @Model() model!: string;
  @Model('param') modelParams!: string;
  // @Model() modelModifiers!: ModelMetaEmitter<string>;
  // @Model() modelParamModifiers!: ModelMetaEmitter<string>;

  private update = (event: MouseEvent) => {
  };

  modelChange = () => {
    // console.log("modelChange", this.model);
    this.model += '1'
  }
  modelParamsChange = () => {
    // console.log("modelParamsChange", this.modelParams);
    this.modelParams += '1'
  }

  constructor() {
  }

  onMounted(): void {
    console.log(this);
    window.addEventListener("mousemove", this.update);
  }

  onUnmounted(): void {
    window.removeEventListener("mousemove", this.update);
  }
}
