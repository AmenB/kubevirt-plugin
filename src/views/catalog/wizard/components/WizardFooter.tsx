import * as React from 'react';
import { useHistory } from 'react-router-dom';

import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import { useKubevirtTranslation } from '@kubevirt-utils/hooks/useKubevirtTranslation';
import { getResourceUrl } from '@kubevirt-utils/resources/shared';
import {
  Alert,
  Button,
  Checkbox,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { useWizardVmCreate } from '../../utils/useWizardVmCreate';
import { clearSessionStorageVM, useWizardVMContext } from '../../utils/WizardVMContext';

export const WizardFooter: React.FC<{ namespace: string }> = ({ namespace }) => {
  const history = useHistory();
  const { t } = useKubevirtTranslation();

  const [startVM, setStartVM] = React.useState(true);
  const { vm, loaded: vmContextLoaded, disableVmCreate, tabsData } = useWizardVMContext();
  const { createVM, loaded: vmCreateLoaded, error: vmCreateError } = useWizardVmCreate();
  const templateName = tabsData?.overview?.templateMetadata?.name;
  const templateNamespace = tabsData?.overview?.templateMetadata?.namespace;

  const onCreate = () =>
    createVM(vm, {
      namespace,
      startVM,
      onFullfilled: (createdVM) => {
        clearSessionStorageVM();
        history.push(getResourceUrl(VirtualMachineModel, createdVM));
      },
    });

  const loaded = vmContextLoaded && vmCreateLoaded;

  return (
    <footer className="vm-wizard-footer">
      <Stack hasGutter>
        <StackItem>
          <Checkbox
            id="start-after-create-checkbox"
            isChecked={startVM}
            onChange={(v) => setStartVM(v)}
            label={t('Start this VirtualMachine after creation')}
          />
        </StackItem>
        <StackItem />
        {vmCreateError && (
          <StackItem>
            <Alert variant="danger" title={t('Create VirtualMachine error')} isInline>
              {vmCreateError.message}
            </Alert>
          </StackItem>
        )}
        <Split hasGutter>
          <SplitItem>
            <Button
              isDisabled={!vm || !loaded || disableVmCreate}
              isLoading={!vmCreateLoaded}
              variant="primary"
              onClick={onCreate}
            >
              {t('Create VirtualMachine')}
            </Button>
          </SplitItem>
          {templateName && templateNamespace && (
            <SplitItem>
              <Button
                variant="secondary"
                onClick={() =>
                  confirm(t('Are you sure you want to go back?')) &&
                  history.push(
                    `/k8s/ns/${namespace}/templatescatalog/customize?name=${templateName}&namespace=${templateNamespace}`,
                  )
                }
              >
                {t('Back')}
              </Button>
            </SplitItem>
          )}
          <SplitItem>
            <Button
              variant="link"
              onClick={() =>
                confirm(t('Are you sure you want to cancel?')) &&
                history.push(`/k8s/ns/${namespace}/templatescatalog`)
              }
            >
              {t('Cancel')}
            </Button>
          </SplitItem>
        </Split>
      </Stack>
    </footer>
  );
};
