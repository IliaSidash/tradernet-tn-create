import ENTITY_NAME from "./ENTITY_NAME";

export default {
  title: "STORIES_TITLE",
  component: ENTITY_NAME,
};

const Template = (args) => ({
  components: { ENTITY_NAME },
  setup() {
    return { ...args };
  },
  template: "<ENTITY_NAME />",
});

export const Default = Template.bind({});
Default.args = {};
