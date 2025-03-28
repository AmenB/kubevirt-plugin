import React, { FC } from 'react';

import {
  modelToGroupVersionKind,
  TemplateModel,
  V1Template,
} from '@kubevirt-ui/kubevirt-api/console';
import Loading from '@kubevirt-utils/components/Loading/Loading';
import { SidebarEditorProvider } from '@kubevirt-utils/components/SidebarEditor/SidebarEditorContext';
import { HorizontalNav, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye } from '@patternfly/react-core';

import useEditTemplateAccessReview from './hooks/useIsTemplateEditable';
import { useVirtualMachineTabs } from './hooks/useTemplateTabs';
import TemplatePageTitle from './TemplatePageTitle';

type TemplateNavPageProps = {
  name: string;
  namespace: string;
};

const TemplateNavPage: FC<TemplateNavPageProps> = ({ name, namespace }) => {
  const [template, loaded] = useK8sWatchResource<V1Template>({
    groupVersionKind: modelToGroupVersionKind(TemplateModel),
    isList: false,
    name,
    namespace,
    namespaced: true,
  });
  const pages = useVirtualMachineTabs();
  const { isTemplateEditable } = useEditTemplateAccessReview(template);

  if (!loaded)
    return (
      <Bullseye>
        <Loading />
      </Bullseye>
    );

  return (
    <SidebarEditorProvider isEditable={isTemplateEditable}>
      <TemplatePageTitle template={template} />
      <HorizontalNav pages={pages} resource={template} />
    </SidebarEditorProvider>
  );
};

export default TemplateNavPage;
